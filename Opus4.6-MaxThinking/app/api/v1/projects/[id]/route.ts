import { db } from "@/db";
import { projects } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateProjectSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const project = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!project) return errorResponse("Project not found", 404);
    return jsonResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateProjectSchema, body);

    const result = db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
      .get();

    if (!result) return errorResponse("Project not found", 404);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.delete(projects).where(eq(projects.id, id)).returning().get();
    if (!result) return errorResponse("Project not found", 404);
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
