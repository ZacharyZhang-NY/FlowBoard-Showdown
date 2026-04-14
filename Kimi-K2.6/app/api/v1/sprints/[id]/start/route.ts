import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifySprintOwnership } from "@/lib/api-utils";
import { z } from "zod";

const startSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * @swagger
 * /api/v1/sprints/{id}/start:
 *   put:
 *     summary: Start a sprint
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
 *               startDate: { type: string }
 *               endDate: { type: string }
 *     responses:
 *       200:
 *         description: Started sprint
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
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [sprint] = await db
    .update(schema.sprints)
    .set({
      status: "active",
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    })
    .where(eq(schema.sprints.id, id))
    .returning();

  if (!sprint) return notFound();
  return json(sprint);
}
