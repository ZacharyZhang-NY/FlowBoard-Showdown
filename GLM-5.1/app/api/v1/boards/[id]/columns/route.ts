import { NextRequest } from "next/server";
import { db } from "@/db";
import { columns } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();
  const { name, color, wipLimit } = body;

  if (!name) return errorResponse("VALIDATION_ERROR", "Name is required");

  const posResult = db
    .select({ maxPos: max(columns.position) })
    .from(columns)
    .where(eq(columns.boardId, id))
    .get();

  const [column] = db
    .insert(columns)
    .values({
      boardId: id,
      name,
      position: (posResult?.maxPos ?? -1) + 1,
      color: color || "gray",
      wipLimit: wipLimit ?? null,
    })
    .returning()
    .all();

  return successResponse(column, 201);
}
