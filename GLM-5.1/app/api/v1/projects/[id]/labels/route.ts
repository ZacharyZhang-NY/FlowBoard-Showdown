import { NextRequest } from "next/server";
import { db } from "@/db";
import { labels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const allLabels = db.select().from(labels).where(eq(labels.projectId, id)).all();
  return successResponse(allLabels);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { name, color } = await request.json();

  if (!name) return errorResponse("VALIDATION_ERROR", "Name is required");

  const [label] = db
    .insert(labels)
    .values({ projectId: id, name, color: color || "blue" })
    .returning()
    .all();

  return successResponse(label, 201);
}
