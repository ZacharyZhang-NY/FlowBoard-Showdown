import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyIssueOwnership } from "@/lib/api-utils";
import { z } from "zod";

const schemaBody = z.object({ labelIds: z.array(z.string()) });

/**
 * @swagger
 * /api/v1/issues/{id}/labels:
 *   put:
 *     summary: Update issue labels
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
 *               labelIds:
 *                 type: array
 *                 items: { type: string }
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
  const parsed = schemaBody.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  await db.transaction(async (tx) => {
    await tx.delete(schema.issueLabels).where(eq(schema.issueLabels.issueId, id));
    for (const labelId of parsed.data.labelIds) {
      await tx.insert(schema.issueLabels).values({ issueId: id, labelId });
    }
  });

  return json({ success: true });
}
