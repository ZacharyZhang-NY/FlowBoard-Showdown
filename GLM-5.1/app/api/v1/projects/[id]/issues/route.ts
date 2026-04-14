import { NextRequest } from "next/server";
import { db } from "@/db";
import { issues, projects, activityLog } from "@/db/schema";
import { eq, and, max, like, desc } from "drizzle-orm";
import { getAuthSession, successResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const type = searchParams.get("type");
  const sprintId = searchParams.get("sprintId");
  const assigneeId = searchParams.get("assigneeId");
  const search = searchParams.get("search");

  let query = db.select().from(issues).where(eq(issues.projectId, id));

  if (status) query = query.where(eq(issues.status, status));
  if (priority) query = query.where(eq(issues.priority, priority));
  if (type) query = query.where(eq(issues.type, type));
  if (sprintId) query = query.where(eq(issues.sprintId, sprintId));
  if (assigneeId) query = query.where(eq(issues.assigneeId, assigneeId));
  if (search) query = query.where(like(issues.title, `%${search}%`));

  const result = query.orderBy(issues.position).all();
  return successResponse(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession(request.headers);
  if (!session) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const body = await request.json();
  const { title, description, status, priority, type, assigneeId, sprintId, columnId, storyPoints, dueDate } = body;

  if (!title) return errorResponse("VALIDATION_ERROR", "Title is required");

  const maxResult = db
    .select({ maxNum: max(issues.number) })
    .from(issues)
    .where(eq(issues.projectId, id))
    .get();

  const number = (maxResult?.maxNum ?? 0) + 1;

  const [issue] = db
    .insert(issues)
    .values({
      projectId: id,
      title,
      description: description || null,
      status: status || "todo",
      priority: priority || "medium",
      type: type || "task",
      assigneeId: assigneeId || null,
      sprintId: sprintId || null,
      columnId: columnId || null,
      storyPoints: storyPoints ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      reporterId: session.user.id,
      number,
      position: number,
    })
    .returning()
    .all();

  db.insert(activityLog).values({
    issueId: issue.id,
    userId: session.user.id,
    action: "created",
    newValue: title,
  }).run();

  return successResponse(issue, 201);
}
