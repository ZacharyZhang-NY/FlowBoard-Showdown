import { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [project] = db.select().from(projects).where(eq(projects.id, id)).limit(1).all();

  if (!project) return errorResponse("NOT_FOUND", "Project not found", 404);
  return successResponse(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();

  try {
    const [updated] = db
      .update(projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
      .all();

    if (!updated) return errorResponse("NOT_FOUND", "Project not found", 404);
    return successResponse(updated);
  } catch (e: unknown) {
    return errorResponse("UPDATE_FAILED", e instanceof Error ? e.message : "Update failed", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [deleted] = db.delete(projects).where(eq(projects.id, id)).returning().all();

  if (!deleted) return errorResponse("NOT_FOUND", "Project not found", 404);
  return successResponse({ deleted: true });
}
