import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifyBoardOwnership } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({ name: z.string().min(1).optional(), position: z.number().optional() });

/**
 * @swagger
 * /api/v1/boards/{id}:
 *   get:
 *     summary: Get a board with columns and issues
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board object with columns and issues
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const hasAccess = await verifyBoardOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const [board] = await db.select().from(schema.boards).where(eq(schema.boards.id, id));
  if (!board) return notFound();

  const columns = await db.select().from(schema.columns).where(eq(schema.columns.boardId, id)).orderBy(asc(schema.columns.position));
  const columnIds = columns.map((c) => c.id);

  const issues = columnIds.length
    ? await db.select().from(schema.issues).where(inArray(schema.issues.columnId, columnIds)).orderBy(asc(schema.issues.position))
    : [];

  return json({ ...board, columns, issues });
}

/**
 * @swagger
 * /api/v1/boards/{id}:
 *   put:
 *     summary: Update a board
 *     tags: [Boards]
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
 *     responses:
 *       200:
 *         description: Updated board
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

  const hasAccess = await verifyBoardOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [board] = await db.update(schema.boards).set(parsed.data).where(eq(schema.boards.id, id)).returning();
  if (!board) return notFound();
  return json(board);
}

/**
 * @swagger
 * /api/v1/boards/{id}:
 *   delete:
 *     summary: Delete a board
 *     tags: [Boards]
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

  const hasAccess = await verifyBoardOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  await db.delete(schema.boards).where(eq(schema.boards.id, id));
  return json({ success: true });
}
