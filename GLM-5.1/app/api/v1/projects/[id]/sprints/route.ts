import { NextRequest } from "next/server";
import { db } from "@/db";
import { sprints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const allSprints = db.select().from(sprints).where(eq(sprints.projectId, id)).all();
  return successResponse(allSprints);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { name, goal, startDate, endDate } = await request.json();

  if (!name) return errorResponse("VALIDATION_ERROR", "Name is required");

  const [sprint] = db
    .insert(sprints)
    .values({
      projectId: id,
      name,
      goal: goal || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    })
    .returning()
    .all();

  return successResponse(sprint, 201);
}
