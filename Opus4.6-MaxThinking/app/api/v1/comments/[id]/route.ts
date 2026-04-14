import { db } from "@/db";
import { comments } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateCommentSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateCommentSchema, body);

    const existing = db.select().from(comments).where(eq(comments.id, id)).get();
    if (!existing) return errorResponse("Comment not found", 404);
    if (existing.authorId !== session.user.id) {
      return errorResponse("You can only edit your own comments", 403);
    }

    const result = db
      .update(comments)
      .set({ content: data.content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning()
      .get();

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = db.select().from(comments).where(eq(comments.id, id)).get();
    if (!existing) return errorResponse("Comment not found", 404);
    if (existing.authorId !== session.user.id) {
      return errorResponse("You can only delete your own comments", 403);
    }

    db.delete(comments).where(eq(comments.id, id)).run();
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
