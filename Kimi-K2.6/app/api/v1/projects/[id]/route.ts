import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifyProjectOwnership } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  key: z.string().min(1).max(10).optional(),
  description: z.string().optional(),
});

async function getProject(id: string) {
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
  return project;
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project object
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

  const project = await getProject(id);
  if (!project) return notFound();
  return json(project);
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *               key: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated project
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

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [project] = await db
    .update(schema.projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.projects.id, id))
    .returning();

  if (!project) return notFound();
  return json(project);
}

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  await db.delete(schema.projects).where(eq(schema.projects.id, id));
  return json({ success: true });
}
