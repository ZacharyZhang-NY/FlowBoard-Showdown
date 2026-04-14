import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyBoardOwnership } from "@/lib/api-utils";
import { z } from "zod";

const reorderSchema = z.object({
  boardId: z.string(),
  columnIds: z.array(z.string()),
});

/**
 * @swagger
 * /api/v1/columns/reorder:
 *   put:
 *     summary: Reorder columns
 *     tags: [Columns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boardId: { type: string }
 *               columnIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Reordered columns
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

  const { boardId, columnIds } = parsed.data;

  const hasAccess = await verifyBoardOwnership(boardId, session.user.id);
  if (!hasAccess) return forbidden();

  await db.transaction(async (tx) => {
    for (let i = 0; i < columnIds.length; i++) {
      await tx.update(schema.columns).set({ position: i }).where(eq(schema.columns.id, columnIds[i]));
    }
  });

  const columns = await db.select().from(schema.columns).where(eq(schema.columns.boardId, boardId));
  return json(columns);
}
