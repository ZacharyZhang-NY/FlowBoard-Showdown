import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyBoardOwnership } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  position: z.number().default(0),
  color: z.string().default("gray"),
  wipLimit: z.number().optional(),
});

/**
 * @swagger
 * /api/v1/boards/{id}/columns:
 *   post:
 *     summary: Create a column
 *     tags: [Columns]
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
 *               name: { type: string }
 *               position: { type: number }
 *               color: { type: string }
 *               wipLimit: { type: number }
 *     responses:
 *       201:
 *         description: Created column
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  if (rateLimit(req)) return tooManyRequests();

  const hasAccess = await verifyBoardOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [column] = await db.insert(schema.columns).values({ ...parsed.data, boardId: id }).returning();
  return json(column, 201);
}
