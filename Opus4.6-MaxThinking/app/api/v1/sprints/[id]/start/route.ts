import { db } from "@/db";
import { sprints } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { startSprintSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(startSprintSchema, body);

    const sprint = db.select().from(sprints).where(eq(sprints.id, id)).get();
    if (!sprint) return errorResponse("Sprint not found", 404);
    if (sprint.status !== "planning") {
      return errorResponse("Sprint can only be started from planning status", 400);
    }

    const result = db
      .update(sprints)
      .set({
        status: "active",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
      .where(eq(sprints.id, id))
      .returning()
      .get();

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
