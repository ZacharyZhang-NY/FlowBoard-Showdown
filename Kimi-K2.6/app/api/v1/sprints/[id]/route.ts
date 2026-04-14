import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifySprintOwnership } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["planning", "active", "completed"]).optional(),
});

/**
 * @swagger
 * /api/v1/sprints/{id}:
 *   put:
 *     summary: Update a sprint
 *     tags: [Sprints]
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
 *               goal: { type: string, nullable: true }
 *               startDate: { type: string, nullable: true }
 *               endDate: { type: string, nullable: true }
 *               status:
 *                 type: string
 *                 enum: [planning, active, completed]
 *     responses:
 *       200:
 *         description: Updated sprint
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

  const hasAccess = await verifySprintOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startDate) updates.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) updates.endDate = new Date(parsed.data.endDate);

  const [sprint] = await db.update(schema.sprints).set(updates).where(eq(schema.sprints.id, id)).returning();
  if (!sprint) return notFound();
  return json(sprint);
}
