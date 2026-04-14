import { db } from "@/db";
import { labels } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.delete(labels).where(eq(labels.id, id)).returning().get();
    if (!result) return errorResponse("Label not found", 404);
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
