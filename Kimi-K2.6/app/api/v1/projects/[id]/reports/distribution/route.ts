import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, notFound, forbidden, json, verifyProjectOwnership } from "@/lib/api-utils";

/**
 * @swagger
 * /api/v1/projects/{id}/reports/distribution:
 *   get:
 *     summary: Get issue distribution by status
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Distribution data
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
  const groups: Record<string, number> = {};
  for (const issue of issues) {
    groups[issue.status] = (groups[issue.status] || 0) + 1;
  }

  const data = Object.entries(groups).map(([status, count]) => ({ group: status, value: count }));
  return json(data);
}
