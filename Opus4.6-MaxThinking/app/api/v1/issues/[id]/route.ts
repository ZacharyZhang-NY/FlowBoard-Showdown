import { db } from "@/db";
import { issues, issueLabels, labels, user, activityLog, projects } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateIssueSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;

    const issue = db.select().from(issues).where(eq(issues.id, id)).get();
    if (!issue) return errorResponse("Issue not found", 404);

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

    const project = db
      .select({ id: projects.id, name: projects.name, key: projects.key })
      .from(projects)
      .where(eq(projects.id, issue.projectId))
      .get()!;

    return jsonResponse({
      ...issue,
      assignee,
      reporter,
      labels: issueLabelsData,
      project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateIssueSchema, body);

    const existing = db.select().from(issues).where(eq(issues.id, id)).get();
    if (!existing) return errorResponse("Issue not found", 404);

    // Track changes for activity log
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];

    if (data.status && data.status !== existing.status) {
      changes.push({ field: "status_changed", oldValue: existing.status, newValue: data.status });
    }
    if (data.priority && data.priority !== existing.priority) {
      changes.push({ field: "priority_changed", oldValue: existing.priority, newValue: data.priority });
    }
    if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
      changes.push({ field: "assigned", oldValue: existing.assigneeId, newValue: data.assigneeId ?? null });
    }

    const { labelIds, ...updateData } = data;

    const result = db
      .update(issues)
      .set({
        ...updateData,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, id))
      .returning()
      .get();

    // Update labels if provided
    if (labelIds !== undefined) {
      db.delete(issueLabels).where(eq(issueLabels.issueId, id)).run();
      for (const labelId of labelIds) {
        db.insert(issueLabels).values({ issueId: id, labelId }).run();
      }
    }

    // Log activity
    for (const change of changes) {
      db.insert(activityLog).values({
        issueId: id,
        userId: session.user.id,
        action: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      }).run();
    }

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.delete(issues).where(eq(issues.id, id)).returning().get();
    if (!result) return errorResponse("Issue not found", 404);
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
