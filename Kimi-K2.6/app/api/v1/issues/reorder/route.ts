import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyIssueOwnership } from "@/lib/api-utils";
import { z } from "zod";

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), position: z.number(), columnId: z.string() })),
});

/**
 * @swagger
 * /api/v1/issues/reorder:
 *   put:
 *     summary: Batch reorder issues
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     position: { type: number }
 *                     columnId: { type: string }
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
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  if (rateLimit(req)) return tooManyRequests();

  const body = await req.json().catch(() => ({}));
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  for (const item of parsed.data.items) {
    const hasAccess = await verifyIssueOwnership(item.id, session.user.id);
    if (!hasAccess) return forbidden();
  }

  db.transaction((tx) => {
    for (const item of parsed.data.items) {
      tx.update(schema.issues)
        .set({ position: item.position, columnId: item.columnId, updatedAt: new Date() })
        .where(eq(schema.issues.id, item.id))
        .run();
    }
  });

  return json({ success: true });
}
