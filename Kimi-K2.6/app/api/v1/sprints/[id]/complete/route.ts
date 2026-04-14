import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession, unauthorized, notFound, forbidden, badRequest, json, rateLimit, tooManyRequests, verifySprintOwnership } from "@/lib/api-utils";
import { z } from "zod";

const completeSchema = z.object({
  moveToBacklogIssueIds: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/v1/sprints/{id}/complete:
 *   put:
 *     summary: Complete a sprint
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
 *               moveToBacklogIssueIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Completed sprint
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
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [sprint] = await db
    .update(schema.sprints)
    .set({ status: "completed" })
    .where(eq(schema.sprints.id, id))
    .returning();

  if (!sprint) return notFound();

  const moveIds = parsed.data.moveToBacklogIssueIds || [];
  if (moveIds.length > 0) {
    await db
      .update(schema.issues)
      .set({ sprintId: null })
      .where(inArray(schema.issues.id, moveIds));
  }

  await db
    .update(schema.issues)
    .set({ sprintId: null })
    .where(and(eq(schema.issues.sprintId, id), eq(schema.issues.status, "done")));

  return json(sprint);
}
