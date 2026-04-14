import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyProjectOwnership } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1), color: z.string().default("blue") });

/**
 * @swagger
 * /api/v1/projects/{id}/labels:
 *   get:
 *     summary: List labels for a project
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of labels
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const labels = await db.select().from(schema.labels).where(eq(schema.labels.projectId, id));
  return json(labels);
}

/**
 * @swagger
 * /api/v1/projects/{id}/labels:
 *   post:
 *     summary: Create a label
 *     tags: [Labels]
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
 *               color: { type: string }
 *     responses:
 *       201:
 *         description: Created label
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

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [label] = await db.insert(schema.labels).values({ ...parsed.data, projectId: id }).returning();
  return json(label, 201);
}
