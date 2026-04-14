import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound, forbidden, json, verifyProjectOwnership } from "@/lib/api-utils";
import { eachDayOfInterval, format, startOfDay } from "date-fns";

/**
 * @swagger
 * /api/v1/projects/{id}/reports/burndown:
 *   get:
 *     summary: Get burndown chart data
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Burndown data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
  if (!project) return notFound();

  const sprint = await db.query.sprints.findFirst({
    where: and(eq(schema.sprints.projectId, id), eq(schema.sprints.status, "active")),
  });

  if (!sprint || !sprint.startDate || !sprint.endDate) {
    return json({ dates: [], ideal: [], actual: [] });
  }

  const start = startOfDay(new Date(sprint.startDate));
  const end = startOfDay(new Date(sprint.endDate));
  const days = eachDayOfInterval({ start, end });

  const issuesInSprint = await db.query.issues.findMany({
    where: and(eq(schema.issues.projectId, id), eq(schema.issues.sprintId, sprint.id)),
  });

  const totalPoints = issuesInSprint.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const dailyBurn = totalPoints / (days.length - 1 || 1);

  const dates = days.map((d) => format(d, "yyyy-MM-dd"));
  const ideal = days.map((_, idx) => Math.max(0, totalPoints - idx * dailyBurn));

  const activityLogs = await db.query.activityLog.findMany({
    where: and(
      eq(schema.activityLog.action, "status_changed"),
      eq(schema.activityLog.newValue, "done")
    ),
  });

  const doneAtMap = new Map<string, Date>();
  for (const log of activityLogs) {
    if (!log.issueId || !log.createdAt) continue;
    const current = doneAtMap.get(log.issueId);
    const logDate = new Date(log.createdAt);
    if (!current || logDate < current) {
      doneAtMap.set(log.issueId, logDate);
    }
  }

  const actual = days.map((day) => {
    const donePoints = issuesInSprint.reduce((sum, i) => {
      if (i.status !== "done") return sum;
      const doneAt = doneAtMap.get(i.id);
      if (doneAt && startOfDay(doneAt) <= day) {
        return sum + (i.storyPoints || 0);
      }
      if (!doneAt) {
        return sum + (i.storyPoints || 0);
      }
      return sum;
    }, 0);
    return Math.max(0, totalPoints - donePoints);
  });

  return json({ dates, ideal, actual });
}
