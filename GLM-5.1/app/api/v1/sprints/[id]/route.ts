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
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.goal !== undefined) updates.goal = body.goal;
  if (body.startDate !== undefined) updates.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) updates.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.status !== undefined) updates.status = body.status;

  const [updated] = db.update(sprints).set(updates).where(eq(sprints.id, id)).returning().all();
  if (!updated) return errorResponse("NOT_FOUND", "Sprint not found", 404);
  return successResponse(updated);
}
