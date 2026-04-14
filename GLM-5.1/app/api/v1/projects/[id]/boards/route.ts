import { NextRequest } from "next/server";
import { db } from "@/db";
import { boards, columns, issues } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const allBoards = db.select().from(boards).where(eq(boards.projectId, id)).all();
  return successResponse(allBoards);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) return errorResponse("VALIDATION_ERROR", "Name is required");

  const posResult = db
    .select({ maxPos: max(boards.position) })
    .from(boards)
    .where(eq(boards.projectId, id))
    .get();

  const [board] = db
    .insert(boards)
    .values({
      projectId: id,
      name,
      position: (posResult?.maxPos ?? -1) + 1,
    })
    .returning()
    .all();

  return successResponse(board, 201);
}
