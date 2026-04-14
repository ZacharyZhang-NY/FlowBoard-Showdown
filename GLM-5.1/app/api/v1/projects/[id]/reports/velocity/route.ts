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

  const completedSprints = db
    .select()
    .from(sprints)
    .where(and(eq(sprints.projectId, id), eq(sprints.status, "completed")))
    .all();

  const velocity = completedSprints.map((sprint) => {
    const done = db
      .select()
      .from(issues)
      .where(and(eq(issues.sprintId, sprint.id), eq(issues.status, "done")))
      .all();
    const points = done.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    return { name: sprint.name, points };
  });

  return successResponse(velocity);
}
