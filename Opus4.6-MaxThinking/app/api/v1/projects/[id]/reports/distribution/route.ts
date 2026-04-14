import { db } from "@/db";
import { issues } from "@/db/schema";
import { jsonResponse, requireAuth, handleApiError } from "@/lib/api";
import { eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id: projectId } = await params;

    const statusDist = db
      .select({
        status: issues.status,
        count: sql<number>`count(*)`,
      })
      .from(issues)
      .where(eq(issues.projectId, projectId))
      .groupBy(issues.status)
      .all();

    const byStatus = statusDist.map((row) => ({
      group: STATUS_LABELS[row.status] || row.status,
      value: row.count,
    }));

    const priorityDist = db
      .select({
        priority: issues.priority,
        count: sql<number>`count(*)`,
      })
      .from(issues)
      .where(eq(issues.projectId, projectId))
      .groupBy(issues.priority)
      .all();

    const byPriority = priorityDist.map((row) => ({
      group: row.priority.charAt(0).toUpperCase() + row.priority.slice(1),
      value: row.count,
    }));

    const typeDist = db
      .select({
        type: issues.type,
        count: sql<number>`count(*)`,
      })
      .from(issues)
      .where(eq(issues.projectId, projectId))
      .groupBy(issues.type)
      .all();

    const byType = typeDist.map((row) => ({
      group: row.type.charAt(0).toUpperCase() + row.type.slice(1),
      value: row.count,
    }));

    return jsonResponse({ byStatus, byPriority, byType });
  } catch (error) {
    return handleApiError(error);
  }
}
