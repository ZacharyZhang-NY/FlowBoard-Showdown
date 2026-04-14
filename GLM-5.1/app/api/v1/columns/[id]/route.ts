import { NextRequest } from "next/server";
import { db } from "@/db";
import { columns } from "@/db/schema";
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

  const [updated] = db
    .update(columns)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.wipLimit !== undefined && { wipLimit: body.wipLimit }),
      ...(body.position !== undefined && { position: body.position }),
    })
    .where(eq(columns.id, id))
    .returning()
    .all();

  if (!updated) return errorResponse("NOT_FOUND", "Column not found", 404);
  return successResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [deleted] = db.delete(columns).where(eq(columns.id, id)).returning().all();
  if (!deleted) return errorResponse("NOT_FOUND", "Column not found", 404);
  return successResponse({ deleted: true });
}
