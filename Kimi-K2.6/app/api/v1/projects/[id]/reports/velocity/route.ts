import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized, notFound, forbidden, json, verifyProjectOwnership } from "@/lib/api-utils";

/**
 * @swagger
 * /api/v1/projects/{id}/reports/velocity:
 *   get:
 *     summary: Get velocity chart data
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Velocity data
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

  const sprints = await db.query.sprints.findMany({
    where: eq(schema.sprints.projectId, id),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    limit: 5,
  });

  const data = await Promise.all(
    sprints.map(async (sprint) => {
      const issues = await db.query.issues.findMany({
        where: and(eq(schema.issues.projectId, id), eq(schema.issues.sprintId, sprint.id)),
      });
      const completed = issues
        .filter((i) => i.status === "done")
        .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      return { sprint: sprint.name, completed, committed: issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0) };
    })
  );

  return json(data.reverse());
}
