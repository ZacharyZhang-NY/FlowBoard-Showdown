import { NextRequest } from "next/server";
import { db } from "@/db";
import { issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function PUT(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { issues: issueList } = await request.json();

  if (!Array.isArray(issueList)) {
    return errorResponse("VALIDATION_ERROR", "issues must be an array");
  }

  for (const item of issueList) {
    db.update(issues)
      .set({ position: item.position, updatedAt: new Date() })
      .where(eq(issues.id, item.id))
      .run();
  }

  return successResponse({ reordered: true });
}
