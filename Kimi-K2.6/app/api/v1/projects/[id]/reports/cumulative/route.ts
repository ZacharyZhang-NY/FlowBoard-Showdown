import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, notFound, forbidden, json, verifyProjectOwnership } from "@/lib/api-utils";
import { eachDayOfInterval, format, subDays, startOfDay } from "date-fns";

/**
 * @swagger
 * /api/v1/projects/{id}/reports/cumulative:
 *   get:
 *     summary: Get cumulative flow chart data
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cumulative flow data
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

  const issues = await db.query.issues.findMany({ where: eq(schema.issues.projectId, id) });
  const end = startOfDay(new Date());
  const start = subDays(end, 30);
  const days = eachDayOfInterval({ start, end });

  const statuses = ["todo", "in_progress", "in_review", "done", "blocked"];
  const data: { group: string; date: string; value: number }[] = [];

  for (const day of days) {
    for (const status of statuses) {
      const count = issues.filter((i) => {
        const created = new Date(i.createdAt);
        return i.status === status && created <= day;
      }).length;
      data.push({ group: status, date: format(day, "yyyy-MM-dd"), value: count });
    }
  }

  return json(data);
}
