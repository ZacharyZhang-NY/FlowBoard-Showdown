import { db } from "@/db";
import { issues, activityLog, columns } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { moveIssueSchema } from "@/lib/validations";
import { eq, and, gt, gte, lt } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(moveIssueSchema, body);

    const issue = db.select().from(issues).where(eq(issues.id, id)).get();
    if (!issue) return errorResponse("Issue not found", 404);

    const oldColumnId = issue.columnId;
    const newColumnId = data.columnId;
    const newPosition = data.position;

    // Get the new column to determine status mapping
    const newColumn = db.select().from(columns).where(eq(columns.id, newColumnId)).get();

    // Shift positions in the target column
    db.update(issues)
      .set({ position: issues.position })
      .where(
        and(
          eq(issues.columnId, newColumnId),
          gte(issues.position, newPosition),
          // Exclude the issue being moved if it's in the same column
          ...(oldColumnId === newColumnId ? [eq(issues.id, id)] : [])
        )
      );

    // Update positions in target column - shift down items at or after new position
    const targetIssues = db
      .select()
      .from(issues)
      .where(and(eq(issues.columnId, newColumnId), gte(issues.position, newPosition)))
      .all();

    for (const targetIssue of targetIssues) {
      if (targetIssue.id !== id) {
        db.update(issues)
          .set({ position: targetIssue.position + 1 })
          .where(eq(issues.id, targetIssue.id))
          .run();
      }
    }

    // Determine new status based on column color
    let newStatus = issue.status;
    if (newColumn && oldColumnId !== newColumnId) {
      const colorToStatus: Record<string, string> = {
        gray: "todo",
        blue: "in_progress",
        purple: "in_review",
        green: "done",
        red: "blocked",
      };
      newStatus = colorToStatus[newColumn.color] || issue.status;
    }

    // Move the issue
    const result = db
      .update(issues)
      .set({
        columnId: newColumnId,
        position: newPosition,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(issues.id, id))
      .returning()
      .get();

    // Log activity if column changed
    if (oldColumnId !== newColumnId) {
      db.insert(activityLog).values({
        issueId: id,
        userId: session.user.id,
        action: "moved",
        oldValue: oldColumnId,
        newValue: newColumnId,
      }).run();

      if (newStatus !== issue.status) {
        db.insert(activityLog).values({
          issueId: id,
          userId: session.user.id,
          action: "status_changed",
          oldValue: issue.status,
          newValue: newStatus,
        }).run();
      }
    }

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
