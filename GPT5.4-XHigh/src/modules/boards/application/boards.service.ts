import { ensure, conflict, notFound } from "@/src/shared/api/errors";
import { parseWithSchema } from "@/src/shared/api/validation";
import { requireProjectAdmin, requireProjectMember } from "@/src/shared/auth/authorization";
import { mapTag, mapUserSummary } from "@/src/shared/api/mappers";
import { toIsoStringRequired } from "@/src/shared/utils/date";
import { defaultBoardColumns } from "@/src/shared/constants/board";
import { createBoardSchema, createColumnSchema, updateBoardSchema, updateColumnSchema, type BoardDetail, type BoardSummary, type BoardIssueCard, boardDetailSchema, boardSummarySchema, reorderColumnsSchema } from "@/src/modules/boards/contract/board.schemas";
import { boardsRepository } from "@/src/modules/boards/infra/boards.repository";

function mapBoardIssue(issue: {
  id: string;
  boardId: string;
  columnId: string | null;
  number: number;
  project: { key: string };
  title: string;
  status: "todo" | "in_progress" | "in_review" | "done" | "blocked";
  priority: "critical" | "high" | "medium" | "low";
  type: "task" | "bug" | "feature" | "improvement";
  position: number;
  version: number;
  storyPoints: number | null;
  dueDate: Date | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  } | null;
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  updatedAt: Date;
}): BoardIssueCard {
  return {
    id: issue.id,
    boardId: issue.boardId,
    columnId: issue.columnId,
    number: issue.number,
    key: issue.project ? `${issue.project.key}-${issue.number}` : String(issue.number),
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    position: issue.position,
    version: issue.version,
    storyPoints: issue.storyPoints,
    dueDate: issue.dueDate ? toIsoStringRequired(issue.dueDate) : null,
    assignee: issue.assignee ? mapUserSummary(issue.assignee) : null,
    labels: issue.labels.map((entry) => mapTag(entry.label)),
    updatedAt: toIsoStringRequired(issue.updatedAt),
  };
}

function applyBoardFilters(
  issues: readonly BoardIssueCard[],
  filters: {
    search?: string;
    assigneeId?: string;
    priority?: string;
    status?: string;
    type?: string;
    labelId?: string;
  },
) {
  return issues.filter((issue) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const haystack = `${issue.key} ${issue.title}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.assigneeId && issue.assignee?.id !== filters.assigneeId) {
      return false;
    }

    if (filters.priority && issue.priority !== filters.priority) {
      return false;
    }

    if (filters.status && issue.status !== filters.status) {
      return false;
    }

    if (filters.type && issue.type !== filters.type) {
      return false;
    }

    if (filters.labelId && !issue.labels.some((label) => label.id === filters.labelId)) {
      return false;
    }

    return true;
  });
}

export const boardsService = {
  async listBoards(userId: string, projectId: string): Promise<BoardSummary[]> {
    await requireProjectMember(userId, projectId);
    const boardRows = await boardsRepository.listByProject(projectId);

    return boardRows.map((board) =>
      boardSummarySchema.parse({
        id: board.id,
        projectId: board.projectId,
        name: board.name,
        position: board.position,
        issueCount: board.issues.length,
        createdAt: toIsoStringRequired(board.createdAt),
        updatedAt: toIsoStringRequired(board.updatedAt),
      }),
    );
  },

  async getBoard(userId: string, boardId: string, filters: {
    search?: string;
    assigneeId?: string;
    priority?: string;
    status?: string;
    type?: string;
    labelId?: string;
  }): Promise<BoardDetail> {
    const board = await boardsRepository.findById(boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectMember(userId, board.projectId);

    const issuesByColumn = new Map<string | null, BoardIssueCard[]>();

    for (const issue of board.issues) {
      const card = mapBoardIssue({
        ...issue,
        project: board.project,
      });
      const current = issuesByColumn.get(issue.columnId) ?? [];
      current.push(card);
      issuesByColumn.set(issue.columnId, current);
    }

    const filteredBoard = {
      id: board.id,
      projectId: board.projectId,
      name: board.name,
      position: board.position,
      createdAt: toIsoStringRequired(board.createdAt),
      updatedAt: toIsoStringRequired(board.updatedAt),
      columns: board.columns.map((column) => ({
        id: column.id,
        boardId: column.boardId,
        name: column.name,
        color: column.color,
        position: column.position,
        wipLimit: column.wipLimit,
        createdAt: toIsoStringRequired(column.createdAt),
        updatedAt: toIsoStringRequired(column.updatedAt),
        issues: applyBoardFilters(issuesByColumn.get(column.id) ?? [], filters),
      })),
    };

    return boardDetailSchema.parse(filteredBoard);
  },

  async createBoard(userId: string, projectId: string, payload: unknown) {
    await requireProjectAdmin(userId, projectId);
    const values = parseWithSchema(createBoardSchema, payload);
    const boardId = await boardsRepository.create(projectId, values);

    for (const column of defaultBoardColumns) {
      await boardsRepository.createColumn(boardId, {
        name: column.name,
        color: column.color,
        wipLimit: column.wipLimit,
      });
    }

    return this.getBoard(userId, boardId, {});
  },

  async updateBoard(userId: string, boardId: string, payload: unknown) {
    const board = await boardsRepository.findById(boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectAdmin(userId, board.projectId);

    const values = parseWithSchema(updateBoardSchema, payload);
    await boardsRepository.update(boardId, {
      name: values.name ?? board.name,
    });

    return this.getBoard(userId, boardId, {});
  },

  async deleteBoard(userId: string, boardId: string) {
    const board = await boardsRepository.findById(boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectAdmin(userId, board.projectId);

    ensure(board.issues.length === 0, conflict("Board contains issues"));
    const projectBoards = await boardsRepository.listByProject(board.projectId);
    ensure(projectBoards.length > 1, conflict("Project requires at least one board"));

    const deleted = await boardsRepository.delete(boardId);
    ensure(deleted[0], notFound("Board not found"));

    return {
      id: deleted[0].id,
      deletedAt: new Date().toISOString(),
    };
  },

  async createColumn(userId: string, boardId: string, payload: unknown) {
    const board = await boardsRepository.findById(boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectAdmin(userId, board.projectId);

    const values = parseWithSchema(createColumnSchema, payload);
    await boardsRepository.createColumn(boardId, values);
    return this.getBoard(userId, boardId, {});
  },

  async updateColumn(userId: string, columnId: string, payload: unknown) {
    const column = await boardsRepository.findColumn(columnId);
    ensure(column, notFound("Column not found"));
    await requireProjectAdmin(userId, column.board.projectId);

    const values = parseWithSchema(updateColumnSchema, payload);
    await boardsRepository.updateColumn(columnId, values);
    return this.getBoard(userId, column.boardId, {});
  },

  async deleteColumn(userId: string, columnId: string) {
    const column = await boardsRepository.findColumn(columnId);
    ensure(column, notFound("Column not found"));
    await requireProjectAdmin(userId, column.board.projectId);
    ensure(column.board.columns.length > 1, conflict("Board requires at least one column"));

    const targetColumn = column.board.columns.find((entry) => entry.id !== columnId) ?? null;
    const issueIds = column.board.issues
      .filter((issue) => issue.columnId === columnId)
      .map((issue) => issue.id);

    await boardsRepository.moveIssuesToColumn(issueIds, targetColumn?.id ?? null);
    await boardsRepository.deleteColumn(columnId);

    return this.getBoard(userId, column.boardId, {});
  },

  async reorderColumns(userId: string, payload: unknown) {
    const values = parseWithSchema(reorderColumnsSchema, payload);
    const board = await boardsRepository.findById(values.boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectAdmin(userId, board.projectId);
    await boardsRepository.reorderColumns(values.boardId, values.columnIds);

    return this.getBoard(userId, values.boardId, {});
  },
};
