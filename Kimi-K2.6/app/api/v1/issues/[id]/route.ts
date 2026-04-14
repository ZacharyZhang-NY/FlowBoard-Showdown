import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, badRequest, notFound, forbidden, json, rateLimit, tooManyRequests, verifyIssueOwnership } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  type: z.enum(["task", "bug", "feature", "improvement"]).optional(),
  assigneeId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  columnId: z.string().optional().nullable(),
  storyPoints: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

/**
 * @swagger
 * /api/v1/issues/{id}:
 *   get:
 *     summary: Get an issue
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue object
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

  const issue = await db.query.issues.findFirst({
    where: eq(schema.issues.id, id),
    with: { assignee: true, reporter: true, sprint: true, column: true, issueLabels: { with: { label: true } } },
  });

  const issueWithLabels = issue
    ? { ...issue, labels: issue.issueLabels?.map((il: any) => il.label) || [] }
    : null;

  if (!issueWithLabels) return notFound();
  return json(issueWithLabels);
}

/**
 * @swagger
 * /api/v1/issues/{id}:
 *   put:
 *     summary: Update an issue
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
 *               description: { type: string, nullable: true }
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
 *       200:
 *         description: Updated issue
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await db.query.issues.findFirst({ where: eq(schema.issues.id, id) });
  if (!existing) return notFound();

  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.dueDate) updates.dueDate = new Date(parsed.data.dueDate);

  const [issue] = await db.update(schema.issues).set(updates).where(eq(schema.issues.id, id)).returning();

  const actions: string[] = [];
  for (const key of Object.keys(parsed.data)) {
    if (key === "dueDate") {
      const oldVal = existing.dueDate ? new Date(existing.dueDate).toISOString() : null;
      const newVal = parsed.data.dueDate;
      if (oldVal !== newVal) actions.push(`${key}_changed`);
    } else if ((existing as Record<string, unknown>)[key] !== parsed.data[key as keyof typeof parsed.data]) {
      actions.push(`${key}_changed`);
    }
  }

  for (const action of actions) {
    const fieldKey = action.replace("_changed", "");
    await db.insert(schema.activityLog).values({
      issueId: id,
      userId: session.user.id,
      action,
      oldValue: String((existing as Record<string, unknown>)[fieldKey] ?? ""),
      newValue: String(parsed.data[fieldKey as keyof typeof parsed.data] ?? ""),
    });
  }

  return json(issue);
}

/**
 * @swagger
 * /api/v1/issues/{id}:
 *   delete:
 *     summary: Delete an issue
 *     tags: [Issues]
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

  const hasAccess = await verifyIssueOwnership(id, session.user.id);
  if (!hasAccess) return forbidden();

  await db.delete(schema.issues).where(eq(schema.issues.id, id));
  return json({ success: true });
}
