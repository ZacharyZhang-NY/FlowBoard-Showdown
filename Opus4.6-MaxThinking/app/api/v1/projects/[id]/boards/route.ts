import { db } from "@/db";
import { boards } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createBoardSchema } from "@/lib/validations";
import { eq, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db
      .select()
      .from(boards)
      .where(eq(boards.projectId, id))
      .orderBy(asc(boards.position))
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
    const data = validateBody(createBoardSchema, body);

    const maxPos = db
      .select()
      .from(boards)
      .where(eq(boards.projectId, id))
      .all();

    const result = db
      .insert(boards)
      .values({
        projectId: id,
        name: data.name,
        position: maxPos.length,
      })
      .returning()
      .get();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
