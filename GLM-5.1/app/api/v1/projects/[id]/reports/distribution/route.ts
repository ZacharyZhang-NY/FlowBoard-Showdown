import { NextRequest } from "next/server";
import { db } from "@/db";
import { issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key] ?? "none");
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const allIssues = db.select().from(issues).where(eq(issues.projectId, id)).all();

  const byStatus = Object.entries(groupBy(allIssues, "status")).map(([name, items]) => ({
    name,
    count: items.length,
  }));

  const byPriority = Object.entries(groupBy(allIssues, "priority")).map(([name, items]) => ({
    name,
    count: items.length,
  }));

  const byType = Object.entries(groupBy(allIssues, "type")).map(([name, items]) => ({
    name,
    count: items.length,
  }));

  return successResponse({ byStatus, byPriority, byType });
}
