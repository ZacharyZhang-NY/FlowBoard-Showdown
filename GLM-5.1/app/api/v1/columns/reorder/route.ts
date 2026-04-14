import { NextRequest } from "next/server";
import { db } from "@/db";
import { columns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { columnIds } = await request.json();

  if (!Array.isArray(columnIds)) {
    return errorResponse("VALIDATION_ERROR", "columnIds must be an array");
  }

  columnIds.forEach((colId: string, index: number) => {
    db.update(columns).set({ position: index }).where(eq(columns.id, colId)).run();
  });

  return successResponse({ reordered: true });
}
