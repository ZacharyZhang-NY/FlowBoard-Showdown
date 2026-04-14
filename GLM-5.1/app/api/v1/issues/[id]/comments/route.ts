import { NextRequest } from "next/server";
import { db } from "@/db";
import { comments, user, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const result = db
    .select({
      id: comments.id,
      issueId: comments.issueId,
      authorId: comments.authorId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorName: user.name,
      authorEmail: user.email,
    })
    .from(comments)
    .innerJoin(user, eq(comments.authorId, user.id))
    .where(eq(comments.issueId, id))
    .orderBy(comments.createdAt)
    .all();

  const formatted = result.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    authorId: r.authorId,
    content: r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    author: { name: r.authorName, email: r.authorEmail },
  }));

  return successResponse(formatted);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { content } = await request.json();

  if (!content) return errorResponse("VALIDATION_ERROR", "Content is required");

  const [comment] = db
    .insert(comments)
    .values({
      issueId: id,
      authorId: session.user.id,
      content,
    })
    .returning()
    .all();

  db.insert(activityLog).values({
    issueId: id,
    userId: session.user.id,
    action: "commented",
    newValue: content.slice(0, 100),
  }).run();

  return successResponse(comment, 201);
}
