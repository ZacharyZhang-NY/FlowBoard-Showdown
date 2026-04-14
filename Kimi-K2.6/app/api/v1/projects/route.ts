import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized, badRequest, json } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).max(10),
  description: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Array of projects
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.createdBy, session.user.id),
    orderBy: desc(schema.projects.updatedAt),
  });
  return json(projects);
}

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
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
 *       201:
 *         description: Created project
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const [project] = await db
    .insert(schema.projects)
    .values({
      ...parsed.data,
      createdBy: session.user.id,
    })
    .returning();

  return json(project, 201);
}
