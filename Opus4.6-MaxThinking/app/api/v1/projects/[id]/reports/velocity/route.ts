import { db } from "@/db";
import { sprints, issues } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: projectId } = await params;

    const allSprints = db
      .select()
      .from(sprints)
      .where(eq(sprints.projectId, projectId))
      .all();

    const data = allSprints.map((sprint) => {
      const sprintIssues = db
        .select()
        .from(issues)
        .where(eq(issues.sprintId, sprint.id))
        .all();

      const committed = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      const completed = sprintIssues
        .filter((i) => i.status === "done")
        .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

      return {
        sprint: sprint.name,
        committed,
        completed,
      };
    });

    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
