import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized, forbidden, json, verifyIssueOwnership } from "@/lib/api-utils";

/**
 * @swagger
 * /api/v1/issues/{id}/activity:
 *   get:
 *     summary: Get activity log for an issue
 *     tags: [Activity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of activity logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const hasAccess = await verifyIssueOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const logs = await db.query.activityLog.findMany({
    where: eq(schema.activityLog.issueId, id),
    with: { user: true },
    orderBy: [desc(schema.activityLog.createdAt)],
  });
  return json(logs);
}
