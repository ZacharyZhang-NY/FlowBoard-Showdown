import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and, like, inArray, isNull } from "drizzle-orm";
import { getSession, unauthorized, badRequest, forbidden, json, rateLimit, tooManyRequests, verifyProjectOwnership } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  type: z.enum(["task", "bug", "feature", "improvement"]).optional(),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  columnId: z.string().optional().nullable(),
  storyPoints: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/**
 * @swagger
 * /api/v1/projects/{id}/issues:
 *   get:
 *     summary: List issues for a project
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of issues
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return unauthorized();
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const assigneeId = searchParams.get("assigneeId");
  const sprintId = searchParams.get("sprintId");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const hasAccess = await verifyProjectOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  let conditions = [eq(schema.issues.projectId, id)];
  if (status) conditions.push(eq(schema.issues.status, status));
  if (priority) conditions.push(eq(schema.issues.priority, priority));
  if (type) conditions.push(eq(schema.issues.type, type));
  if (assigneeId) conditions.push(eq(schema.issues.assigneeId, assigneeId));
  if (sprintId === "null" || sprintId === "") conditions.push(isNull(schema.issues.sprintId));
  else if (sprintId) conditions.push(eq(schema.issues.sprintId, sprintId));
  if (q) conditions.push(like(schema.issues.title, `%${escapeLike(q)}%`));

  const issues = await db.query.issues.findMany({
    where: and(...conditions),
    with: { assignee: true, reporter: true, sprint: true },
    orderBy: [desc(schema.issues.updatedAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return json(issues);
}

/**
 * @swagger
 * /api/v1/projects/{id}/issues:
 *   post:
 *     summary: Create an issue
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
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, in_review, done, blocked]
 *               priority:
 *                 type: string
 *                 enum: [critical, high, medium, low]
 *               type:
 *                 type: string
 *                 enum: [task, bug, feature, improvement]
 *               assigneeId: { type: string, nullable: true }
 *               sprintId: { type: string, nullable: true }
 *               columnId: { type: string, nullable: true }
 *               storyPoints: { type: number, nullable: true }
 *               dueDate: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created issue
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

  const existing = await db.select({ max: schema.issues.number }).from(schema.issues).where(eq(schema.issues.projectId, id)).orderBy(desc(schema.issues.number)).limit(1);
  const nextNumber = (existing[0]?.max || 0) + 1;

  const values = {
    ...parsed.data,
    projectId: id,
    number: nextNumber,
    reporterId: session.user.id,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
  };

  const [issue] = await db.insert(schema.issues).values(values as any).returning();

  await db.insert(schema.activityLog).values({
    issueId: issue.id,
    userId: session.user.id,
    action: "created",
    newValue: issue.title,
  });

  return json(issue, 201);
}
