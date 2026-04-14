import { NextRequest } from "next/server";
import { db } from "@/db";
import { issues, issueLabels, labels, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const issue = db.select().from(issues).where(eq(issues.id, id)).get();

  if (!issue) return errorResponse("NOT_FOUND", "Issue not found", 404);

  const issueLabelRows = db
    .select({ id: labels.id, name: labels.name, color: labels.color })
    .from(issueLabels)
    .innerJoin(labels, eq(issueLabels.labelId, labels.id))
    .where(eq(issueLabels.issueId, id))
    .all();

  return successResponse({ ...issue, labels: issueLabelRows });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();

  const existing = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!existing) return errorResponse("NOT_FOUND", "Issue not found", 404);

  const trackedFields = ["status", "priority", "type", "assigneeId"] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  for (const field of trackedFields) {
    if (body[field] !== undefined && body[field] !== existing[field]) {
      db.insert(activityLog).values({
        issueId: id,
        userId: session.user.id,
        action: `${field}_changed`,
        oldValue: String(existing[field] ?? ""),
        newValue: String(body[field] ?? ""),
      }).run();
      updates[field] = body[field];
    }
  }

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.storyPoints !== undefined) updates.storyPoints = body.storyPoints;
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.columnId !== undefined) updates.columnId = body.columnId;
  if (body.sprintId !== undefined) updates.sprintId = body.sprintId;
  if (body.position !== undefined) updates.position = body.position;

  if (body.labels !== undefined) {
    db.delete(issueLabels).where(eq(issueLabels.issueId, id)).run();
    for (const labelId of body.labels) {
      db.insert(issueLabels).values({ issueId: id, labelId }).run();
    }
  }

  const [updated] = db.update(issues).set(updates).where(eq(issues.id, id)).returning().all();
  return successResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [deleted] = db.delete(issues).where(eq(issues.id, id)).returning().all();
  if (!deleted) return errorResponse("NOT_FOUND", "Issue not found", 404);
  return successResponse({ deleted: true });
}
