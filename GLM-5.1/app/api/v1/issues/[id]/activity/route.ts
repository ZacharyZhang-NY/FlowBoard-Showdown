import { NextRequest } from "next/server";
import { db } from "@/db";
import { activityLog, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const result = db
    .select({
      id: activityLog.id,
      issueId: activityLog.issueId,
      userId: activityLog.userId,
      action: activityLog.action,
      oldValue: activityLog.oldValue,
      newValue: activityLog.newValue,
      createdAt: activityLog.createdAt,
      userName: user.name,
    })
    .from(activityLog)
    .innerJoin(user, eq(activityLog.userId, user.id))
    .where(eq(activityLog.issueId, id))
    .orderBy(activityLog.createdAt)
    .all();

  const formatted = result.map((r) => ({
    id: r.id,
    issueId: r.issueId,
    userId: r.userId,
    action: r.action,
    oldValue: r.oldValue,
    newValue: r.newValue,
    createdAt: r.createdAt,
    user: { name: r.userName },
  }));

  return successResponse(formatted);
}
