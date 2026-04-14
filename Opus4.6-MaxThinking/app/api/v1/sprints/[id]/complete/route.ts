import { db } from "@/db";
import { sprints, issues } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq, and, ne } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;

    const sprint = db.select().from(sprints).where(eq(sprints.id, id)).get();
    if (!sprint) return errorResponse("Sprint not found", 404);
    if (sprint.status !== "active") {
      return errorResponse("Only active sprints can be completed", 400);
    }

    // Move incomplete issues back to backlog (remove from sprint)
    const incompleteIssues = db
      .select()
      .from(issues)
      .where(and(eq(issues.sprintId, id), ne(issues.status, "done")))
      .all();

    for (const issue of incompleteIssues) {
      db.update(issues)
        .set({ sprintId: null, updatedAt: new Date() })
        .where(eq(issues.id, issue.id))
        .run();
    }

    const result = db
      .update(sprints)
      .set({ status: "completed" })
      .where(eq(sprints.id, id))
      .returning()
      .get();

    return jsonResponse({
      sprint: result,
      movedToBacklog: incompleteIssues.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
