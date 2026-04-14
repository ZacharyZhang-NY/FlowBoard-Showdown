import { NextRequest } from "next/server";
import { db } from "@/db";
import { boards, columns, issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const board = db.select().from(boards).where(eq(boards.id, id)).get();

  if (!board) return errorResponse("NOT_FOUND", "Board not found", 404);

  const cols = db.select().from(columns).where(eq(columns.boardId, id)).orderBy(columns.position).all();

  const boardColumns = cols.map((col) => ({
    ...col,
    issues: db.select().from(issues).where(eq(issues.columnId, col.id)).orderBy(issues.position).all(),
  }));

  return successResponse({ ...board, columns: boardColumns });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();

  const [updated] = db.update(boards).set(body).where(eq(boards.id, id)).returning().all();
  if (!updated) return errorResponse("NOT_FOUND", "Board not found", 404);
  return successResponse(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [deleted] = db.delete(boards).where(eq(boards.id, id)).returning().all();
  if (!deleted) return errorResponse("NOT_FOUND", "Board not found", 404);
  return successResponse({ deleted: true });
}
