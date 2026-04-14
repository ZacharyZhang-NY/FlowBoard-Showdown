import { db } from "@/db";
import { projects } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { createProjectSchema } from "@/lib/validations";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAuth();
    const result = db.select().from(projects).orderBy(desc(projects.createdAt)).all();
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = validateBody(createProjectSchema, body);

    const result = db
      .insert(projects)
      .values({
        name: data.name,
        key: data.key,
        description: data.description,
        createdBy: session.user.id,
      })
      .returning()
      .get();

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
