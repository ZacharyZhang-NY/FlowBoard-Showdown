import { db } from "@/db";
import { columns } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { reorderColumnsSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const data = validateBody(reorderColumnsSchema, body);

    for (const col of data.columns) {
      db.update(columns)
        .set({ position: col.position })
        .where(eq(columns.id, col.id))
        .run();
    }

    return jsonResponse({ reordered: true });
  } catch (error) {
    return handleApiError(error);
  }
}
