import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyIssueOwnership } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({ content: z.string().min(1) });

/**
 * @swagger
 * /api/v1/issues/{id}/comments:
 *   get:
 *     summary: List comments for an issue
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of comments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const hasAccess = await verifyIssueOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const comments = await db.query.comments.findMany({
    where: eq(schema.comments.issueId, id),
    with: { author: true },
    orderBy: [desc(schema.comments.createdAt)],
  });
  return json(comments);
}

/**
 * @swagger
 * /api/v1/issues/{id}/comments:
 *   post:
 *     summary: Add a comment to an issue
 *     tags: [Comments]
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
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Created comment
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

  const hasAccess = await verifyIssueOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [comment] = await db
    .insert(schema.comments)
    .values({ issueId: id, authorId: session.user.id, content: parsed.data.content })
    .returning();

  await db.insert(schema.activityLog).values({
    issueId: id,
    userId: session.user.id,
    action: "commented",
    newValue: parsed.data.content,
  });

  return json(comment, 201);
}
