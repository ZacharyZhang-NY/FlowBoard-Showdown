import { NextRequest } from "next/server";
import { db } from "@/db";
import { sprints, issues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const sprint = db
    .select()
    .from(sprints)
    .where(and(eq(sprints.projectId, id), eq(sprints.status, "active")))
    .get();

  if (!sprint) return successResponse({ sprintName: null, days: [], ideal: [], actual: [], totalPoints: 0 });

  const sprintIssues = db.select().from(issues).where(eq(issues.sprintId, sprint.id)).all();
  const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  const start = sprint.startDate ? new Date(sprint.startDate) : new Date();
  const end = sprint.endDate ? new Date(sprint.endDate) : new Date(start.getTime() + 14 * 86400000);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

  const days: string[] = [];
  const ideal: number[] = [];
  const actual: number[] = [];

  for (let d = 0; d <= totalDays; d++) {
    const day = new Date(start.getTime() + d * 86400000);
    days.push(day.toISOString().split("T")[0]);
    ideal.push(Math.round(totalPoints * (1 - d / totalDays)));
  }

  // Current remaining
  const remaining = sprintIssues
    .filter((i) => i.status !== "done")
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  actual.push(totalPoints, ...Array(totalDays).fill(remaining));

  return successResponse({ sprintName: sprint.name, days, ideal, actual, totalPoints });
}
