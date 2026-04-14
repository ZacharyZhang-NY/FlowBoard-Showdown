import { NextRequest } from "next/server";
import { db } from "@/db";
import { issues, columns, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { columnId, position, status } = await request.json();

  const existing = db.select().from(issues).where(eq(issues.id, id)).get();
  if (!existing) return errorResponse("NOT_FOUND", "Issue not found", 404);

  const oldColumn = existing.columnId
    ? db.select({ name: columns.name }).from(columns).where(eq(columns.id, existing.columnId)).get()
    : null;

  const newColumn = columnId
    ? db.select({ name: columns.name }).from(columns).where(eq(columns.id, columnId)).get()
    : null;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (columnId !== undefined) updates.columnId = columnId;
  if (position !== undefined) updates.position = position;
  if (status !== undefined) updates.status = status;

  db.insert(activityLog).values({
    issueId: id,
    userId: session.user.id,
    action: "moved",
    oldValue: oldColumn?.name ?? "Backlog",
    newValue: newColumn?.name ?? "Backlog",
  }).run();

  const [updated] = db.update(issues).set(updates).where(eq(issues.id, id)).returning().all();
  return successResponse(updated);
}
