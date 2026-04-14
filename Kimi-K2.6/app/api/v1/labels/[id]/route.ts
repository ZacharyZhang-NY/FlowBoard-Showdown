import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden, json, rateLimit, tooManyRequests, verifyLabelOwnership } from "@/lib/api-utils";

/**
 * @swagger
 * /api/v1/labels/{id}:
 *   delete:
 *     summary: Delete a label
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  if (rateLimit(req)) return tooManyRequests();

  const hasAccess = await verifyLabelOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  await db.delete(schema.labels).where(eq(schema.labels.id, id));
  return json({ success: true });
}
