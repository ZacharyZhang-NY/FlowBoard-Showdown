import { db } from "@/db";
import { columns } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateColumnSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateColumnSchema, body);

    const result = db
      .update(columns)
      .set(data)
      .where(eq(columns.id, id))
      .returning()
      .get();

    if (!result) return errorResponse("Column not found", 404);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.delete(columns).where(eq(columns.id, id)).returning().get();
    if (!result) return errorResponse("Column not found", 404);
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
