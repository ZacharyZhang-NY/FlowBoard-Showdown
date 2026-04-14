import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifyColumnOwnership } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().optional(),
  color: z.string().optional(),
  wipLimit: z.number().optional().nullable(),
});

/**
 * @swagger
 * /api/v1/columns/{id}:
 *   put:
 *     summary: Update a column
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
 *               wipLimit: { type: number, nullable: true }
 *     responses:
 *       200:
 *         description: Updated column
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

  const hasAccess = await verifyColumnOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [column] = await db.update(schema.columns).set(parsed.data).where(eq(schema.columns.id, id)).returning();
  if (!column) return notFound();
  return json(column);
}

/**
 * @swagger
 * /api/v1/columns/{id}:
 *   delete:
 *     summary: Delete a column
 *     tags: [Columns]
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

  const hasAccess = await verifyColumnOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  await db.delete(schema.columns).where(eq(schema.columns.id, id));
  return json({ success: true });
}
