import { db } from "@/db";
import { issues } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { reorderIssuesSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const data = validateBody(reorderIssuesSchema, body);

    for (const item of data.issues) {
      db.update(issues)
        .set({ columnId: item.columnId, position: item.position, updatedAt: new Date() })
        .where(eq(issues.id, item.id))
        .run();
    }

    return jsonResponse({ reordered: true });
  } catch (error) {
    return handleApiError(error);
  }
}
