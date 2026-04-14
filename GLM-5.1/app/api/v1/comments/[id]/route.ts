import { NextRequest } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { content } = await request.json();

  if (!content) return errorResponse("VALIDATION_ERROR", "Content is required");

  const existing = db.select().from(comments).where(eq(comments.id, id)).get();
  if (!existing) return errorResponse("NOT_FOUND", "Comment not found", 404);

  if (existing.authorId !== session.user.id) {
    return errorResponse("FORBIDDEN", "Only the author can edit this comment", 403);
  }

  const [updated] = db
    .update(comments)
    .set({ content, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning()
    .all();

  return successResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const existing = db.select().from(comments).where(eq(comments.id, id)).get();
  if (!existing) return errorResponse("NOT_FOUND", "Comment not found", 404);

  if (existing.authorId !== session.user.id) {
    return errorResponse("FORBIDDEN", "Only the author can delete this comment", 403);
  }

  db.delete(comments).where(eq(comments.id, id)).run();
  return successResponse({ deleted: true });
}
