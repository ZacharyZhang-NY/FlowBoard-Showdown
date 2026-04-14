import { db } from "@/db";
import { columns } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createColumnSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: boardId } = await params;
    const body = await request.json();
    const data = validateBody(createColumnSchema, body);

    const existing = db
      .select()
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .all();

    const result = db
      .insert(columns)
      .values({
        boardId,
        name: data.name,
        color: data.color,
        wipLimit: data.wipLimit ?? null,
        position: existing.length,
      })
      .returning()
      .get();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
