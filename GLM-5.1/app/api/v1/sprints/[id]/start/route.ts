import { NextRequest } from "next/server";
import { db } from "@/db";
import { sprints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { startDate, endDate } = await request.json();

  if (!startDate || !endDate) {
    return errorResponse("VALIDATION_ERROR", "Start date and end date are required");
  }

  const [updated] = db
    .update(sprints)
    .set({
      status: "active",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    })
    .where(eq(sprints.id, id))
    .returning()
    .all();

  if (!updated) return errorResponse("NOT_FOUND", "Sprint not found", 404);
  return successResponse(updated);
}
