import { db } from "@/db";
import { comments, activityLog, user } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createCommentSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: issueId } = await params;

    const result = db
      .select()
      .from(comments)
      .where(eq(comments.issueId, issueId))
      .orderBy(desc(comments.createdAt))
      .all();

    const commentsWithAuthor = result.map((comment) => {
      const author = db
        .select({ id: user.id, name: user.name, email: user.email, image: user.image })
        .from(user)
        .where(eq(user.id, comment.authorId))
        .get()!;
      return { ...comment, author };
    });

    return jsonResponse(commentsWithAuthor);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id: issueId } = await params;
    const body = await request.json();
    const data = validateBody(createCommentSchema, body);

    const result = db
      .insert(comments)
      .values({
        issueId,
        authorId: session.user.id,
        content: data.content,
      })
      .returning()
      .get();

    db.insert(activityLog).values({
      issueId,
      userId: session.user.id,
      action: "commented",
      newValue: data.content.slice(0, 100),
    }).run();

    const author = db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id))
      .get()!;

    return jsonResponse({ ...result, author }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
