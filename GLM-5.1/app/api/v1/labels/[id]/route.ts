import { NextRequest } from "next/server";
import { db } from "@/db";
import { labels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const [deleted] = db.delete(labels).where(eq(labels.id, id)).returning().all();
  if (!deleted) return errorResponse("NOT_FOUND", "Label not found", 404);
  return successResponse({ deleted: true });
}
