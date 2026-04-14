import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifyIssueOwnership } from "@/lib/api-utils";
import { z } from "zod";

const moveSchema = z.object({
  columnId: z.string(),
  position: z.number(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]).optional(),
});

/**
 * @swagger
 * /api/v1/issues/{id}/move:
 *   put:
 *     summary: Move an issue to a column
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columnId: { type: string }
 *               position: { type: number }
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, in_review, done, blocked]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  if (rateLimit(req)) return tooManyRequests();

  const hasAccess = await verifyIssueOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await db.query.issues.findFirst({ where: eq(schema.issues.id, id) });
  if (!existing) return notFound();

  const { columnId, position, status } = parsed.data;
  const oldColumnId = existing.columnId;

  const updateSet: Record<string, unknown> = { columnId, position, updatedAt: new Date() };
  if (status) updateSet.status = status;

  await db.update(schema.issues).set(updateSet).where(eq(schema.issues.id, id));

  if (oldColumnId !== columnId) {
    await db.insert(schema.activityLog).values({
      issueId: id,
      userId: session.user.id,
      action: "moved",
      oldValue: oldColumnId ?? "",
      newValue: columnId,
    });
  }

  if (status && existing.status !== status) {
    await db.insert(schema.activityLog).values({
      issueId: id,
      userId: session.user.id,
      action: "status_changed",
      oldValue: existing.status,
      newValue: status,
    });
  }

  return json({ success: true });
}
