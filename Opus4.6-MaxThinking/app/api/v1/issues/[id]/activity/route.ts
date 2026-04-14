import { db } from "@/db";
import { activityLog, user } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: issueId } = await params;

    const result = db
      .select()
      .from(activityLog)
      .where(eq(activityLog.issueId, issueId))
      .orderBy(desc(activityLog.createdAt))
      .all();

    const activitiesWithUser = result.map((activity) => {
      const activityUser = db
        .select({ id: user.id, name: user.name, email: user.email, image: user.image })
        .from(user)
        .where(eq(user.id, activity.userId))
        .get()!;
      return { ...activity, user: activityUser };
    });

    return jsonResponse(activitiesWithUser);
  } catch (error) {
    return handleApiError(error);
  }
}
