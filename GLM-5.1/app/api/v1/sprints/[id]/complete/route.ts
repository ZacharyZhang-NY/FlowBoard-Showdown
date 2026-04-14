import { NextRequest } from "next/server";
import { db } from "@/db";
import { sprints, issues } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const [updated] = db
    .update(sprints)
    .set({ status: "completed" })
    .where(eq(sprints.id, id))
    .returning()
    .all();

  if (!updated) return errorResponse("NOT_FOUND", "Sprint not found", 404);

  // Move non-done issues back to backlog
  const openIssues = db
    .select({ id: issues.id })
    .from(issues)
    .where(and(eq(issues.sprintId, id), ne(issues.status, "done")))
    .all();

  for (const issue of openIssues) {
    db.update(issues).set({ sprintId: null, updatedAt: new Date() }).where(eq(issues.id, issue.id)).run();
  }

  return successResponse({ ...updated, movedToBacklog: openIssues.length });
}
