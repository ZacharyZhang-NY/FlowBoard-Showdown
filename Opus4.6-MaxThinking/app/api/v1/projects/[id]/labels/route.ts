import { db } from "@/db";
import { labels } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createLabelSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.select().from(labels).where(eq(labels.projectId, id)).all();
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
    const data = validateBody(createLabelSchema, body);

    const result = db
      .insert(labels)
      .values({
        projectId: id,
        name: data.name,
        color: data.color,
      })
      .returning()
      .get();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
