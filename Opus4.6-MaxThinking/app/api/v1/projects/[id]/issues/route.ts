import { db } from "@/db";
import { issues, issueLabels, user, labels } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createIssueSchema } from "@/lib/validations";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id: projectId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const assigneeId = searchParams.get("assigneeId");
    const sprintId = searchParams.get("sprintId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [eq(issues.projectId, projectId)];

    if (status) conditions.push(eq(issues.status, status));
    if (priority) conditions.push(eq(issues.priority, priority));
    if (type) conditions.push(eq(issues.type, type));
    if (assigneeId) conditions.push(eq(issues.assigneeId, assigneeId));
    if (sprintId) conditions.push(eq(issues.sprintId, sprintId));
    if (search) conditions.push(like(issues.title, `%${search}%`));

    const where = and(...conditions);

    const result = db
      .select()
      .from(issues)
      .where(where)
      .orderBy(desc(issues.updatedAt))
      .limit(limit)
      .offset(offset)
      .all();

    const totalResult = db
      .select({ count: sql<number>`count(*)` })
      .from(issues)
      .where(where)
      .get();

    const total = totalResult?.count ?? 0;

    const issuesWithRelations = result.map((issue) => {
      const assignee = issue.assigneeId
        ? db
            .select({ id: user.id, name: user.name, email: user.email, image: user.image })
            .from(user)
            .where(eq(user.id, issue.assigneeId))
            .get()
        : null;

      const reporter = db
        .select({ id: user.id, name: user.name, email: user.email, image: user.image })
        .from(user)
        .where(eq(user.id, issue.reporterId))
        .get()!;

      const issueLabelRows = db
        .select({ labelId: issueLabels.labelId })
        .from(issueLabels)
        .where(eq(issueLabels.issueId, issue.id))
        .all();

      const issueLabelsData = issueLabelRows
        .map((row) => db.select().from(labels).where(eq(labels.id, row.labelId)).get()!)
        .filter(Boolean);

      return { ...issue, assignee, reporter, labels: issueLabelsData };
    });

    return jsonResponse({ issues: issuesWithRelations, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;
    const body = await request.json();
    const data = validateBody(createIssueSchema, body);

    // Get next issue number for this project
    const lastIssue = db
      .select({ number: issues.number })
      .from(issues)
      .where(eq(issues.projectId, projectId))
      .orderBy(desc(issues.number))
      .limit(1)
      .get();

    const nextNumber = (lastIssue?.number ?? 0) + 1;

    const result = db
      .insert(issues)
      .values({
        projectId,
        number: nextNumber,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        type: data.type,
        columnId: data.columnId,
        sprintId: data.sprintId ?? null,
        assigneeId: data.assigneeId ?? null,
        reporterId: session.user.id,
        storyPoints: data.storyPoints ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position: 0,
      })
      .returning()
      .get();

    // Add labels if provided
    if (data.labelIds && data.labelIds.length > 0) {
      for (const labelId of data.labelIds) {
        db.insert(issueLabels).values({ issueId: result.id, labelId }).run();
      }
    }

    // Log activity
    const { activityLog } = await import("@/db/schema");
    db.insert(activityLog).values({
      issueId: result.id,
      userId: session.user.id,
      action: "created",
      newValue: data.title,
    }).run();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
