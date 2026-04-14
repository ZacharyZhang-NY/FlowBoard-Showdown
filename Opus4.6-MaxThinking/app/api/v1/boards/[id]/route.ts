import { db } from "@/db";
import { boards, columns, issues, issueLabels, labels, user } from "@/db/schema";
import { jsonResponse, errorResponse, requireAuth, handleApiError, validateBody } from "@/lib/api";
import { updateBoardSchema } from "@/lib/validations";
import { eq, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;

    const board = db.select().from(boards).where(eq(boards.id, id)).get();
    if (!board) return errorResponse("Board not found", 404);

    const boardColumns = db
      .select()
      .from(columns)
      .where(eq(columns.boardId, id))
      .orderBy(asc(columns.position))
      .all();

    const columnsWithIssues = await Promise.all(
      boardColumns.map(async (col) => {
        const columnIssues = db
          .select()
          .from(issues)
          .where(eq(issues.columnId, col.id))
          .orderBy(asc(issues.position))
          .all();

        const issuesWithRelations = columnIssues.map((issue) => {
          const assignee = issue.assigneeId
            ? db
                .select({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                })
                .from(user)
                .where(eq(user.id, issue.assigneeId))
                .get()
            : null;

          const reporter = db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            })
            .from(user)
            .where(eq(user.id, issue.reporterId))
            .get()!;

          const issueLabelRows = db
            .select({ labelId: issueLabels.labelId })
            .from(issueLabels)
            .where(eq(issueLabels.issueId, issue.id))
            .all();

          const issueLabelsData = issueLabelRows.map((row) =>
            db.select().from(labels).where(eq(labels.id, row.labelId)).get()!
          ).filter(Boolean);

          return {
            ...issue,
            assignee,
            reporter,
            labels: issueLabelsData,
          };
        });

        return {
          ...col,
          issues: issuesWithRelations,
        };
      })
    );

    return jsonResponse({
      ...board,
      columns: columnsWithIssues,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateBoardSchema, body);

    const result = db
      .update(boards)
      .set(data)
      .where(eq(boards.id, id))
      .returning()
      .get();

    if (!result) return errorResponse("Board not found", 404);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const result = db.delete(boards).where(eq(boards.id, id)).returning().get();
    if (!result) return errorResponse("Board not found", 404);
    return jsonResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
