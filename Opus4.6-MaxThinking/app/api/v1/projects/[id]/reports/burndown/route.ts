import { db } from "@/db";
import { sprints, issues } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq, and } from "drizzle-orm";
import { format, eachDayOfInterval, differenceInDays } from "date-fns";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: projectId } = await params;

    // Find active sprint
    const activeSprint = db
      .select()
      .from(sprints)
      .where(and(eq(sprints.projectId, projectId), eq(sprints.status, "active")))
      .get();

    if (!activeSprint || !activeSprint.startDate || !activeSprint.endDate) {
      return jsonResponse([]);
    }

    const sprintIssues = db
      .select()
      .from(issues)
      .where(eq(issues.sprintId, activeSprint.id))
      .all();

    const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const donePoints = sprintIssues
      .filter((i) => i.status === "done")
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const days = eachDayOfInterval({ start, end });
    const totalDays = days.length;

    const data = days.map((day, index) => {
      const idealRemaining = totalPoints - (totalPoints / (totalDays - 1)) * index;
      const today = new Date();
      const isPast = day <= today;

      // Simple linear projection for actual: proportional completion
      const dayProgress = index / (totalDays - 1);
      const actualRemaining = isPast
        ? totalPoints - donePoints * Math.min(1, dayProgress * 1.5)
        : totalPoints - donePoints;

      return {
        date: format(day, "MMM d"),
        ideal: Math.max(0, Math.round(idealRemaining * 10) / 10),
        actual: isPast ? Math.max(0, Math.round(actualRemaining * 10) / 10) : null,
      };
    });

    return jsonResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
