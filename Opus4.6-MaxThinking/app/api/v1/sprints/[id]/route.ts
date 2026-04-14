import { db } from "@/db";
import { sprints } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateSprintSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const sprint = db.select().from(sprints).where(eq(sprints.id, id)).get();
    if (!sprint) return errorResponse("Sprint not found", 404);
    return jsonResponse(sprint);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateSprintSchema, body);

    const result = db
      .update(sprints)
      .set({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      })
      .where(eq(sprints.id, id))
      .returning()
      .get();

    if (!result) return errorResponse("Sprint not found", 404);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
