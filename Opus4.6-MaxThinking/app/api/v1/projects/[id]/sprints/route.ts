import { db } from "@/db";
import { sprints } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createSprintSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db
      .select()
      .from(sprints)
      .where(eq(sprints.projectId, id))
      .orderBy(desc(sprints.createdAt))
      .all();
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(createSprintSchema, body);

    const result = db
      .insert(sprints)
      .values({
        projectId: id,
        name: data.name,
        goal: data.goal,
        status: "planning",
      })
      .returning()
      .get();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
