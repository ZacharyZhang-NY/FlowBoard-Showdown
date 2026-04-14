import { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const allProjects = db.select().from(projects).all();
  return successResponse(allProjects);
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const body = await request.json();
  const { name, key, description } = body;

  if (!name || !key) {
    return errorResponse("VALIDATION_ERROR", "Name and key are required");
  }

  try {
    const [project] = db
      .insert(projects)
      .values({
        name,
        key: key.toUpperCase(),
        description: description || null,
        createdBy: session.user.id,
      })
      .returning()
      .all();

    return successResponse(project, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create project";
    if (message.includes("UNIQUE")) {
      return errorResponse("DUPLICATE_KEY", "Project key already exists", 409);
    }
    return errorResponse("CREATE_FAILED", message, 500);
  }
}
