import {
  commentSchema,
  createCommentSchema,
  createIssueSchema,
  issueDetailSchema,
  issueListQuerySchema,
  issueListResponseSchema,
  moveIssueSchema,
  reorderIssuesSchema,
  updateCommentSchema,
  updateIssueSchema,
} from "@/src/modules/issues/contract/issue.schemas";
import { issuesRepository } from "@/src/modules/issues/infra/issues.repository";
import { boardsRepository } from "@/src/modules/boards/infra/boards.repository";
import { mapActivityItem, mapTag, mapUserSummary } from "@/src/shared/api/mappers";
import { conflict, ensure, forbidden, notFound, preconditionFailed } from "@/src/shared/api/errors";
import { parseWithSchema } from "@/src/shared/api/validation";
import { getProjectMembership, requireProjectMember } from "@/src/shared/auth/authorization";
import { inferStatusFromColumnName } from "@/src/shared/constants/board";
import { toIsoStringRequired } from "@/src/shared/utils/date";

function mapIssueSummary(issue: {
  id: string;
  projectId: string;
  boardId: string;
  columnId: string | null;
  sprintId: string | null;
  number: number;
  project: { key: string };
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "in_review" | "done" | "blocked";
  priority: "critical" | "high" | "medium" | "low";
  type: "task" | "bug" | "feature" | "improvement";
  storyPoints: number | null;
  dueDate: Date | null;
  position: number;
  version: number;
  assignee: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  } | null;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  labels: Array<{
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: issue.id,
    projectId: issue.projectId,
    boardId: issue.boardId,
    columnId: issue.columnId,
    sprintId: issue.sprintId,
    number: issue.number,
    key: `${issue.project.key}-${issue.number}`,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    storyPoints: issue.storyPoints,
    dueDate: issue.dueDate ? toIsoStringRequired(issue.dueDate) : null,
    position: issue.position,
    version: issue.version,
    assignee: issue.assignee ? mapUserSummary(issue.assignee) : null,
    reporter: mapUserSummary(issue.reporter),
    labels: issue.labels.map((entry) => mapTag(entry.label)),
    createdAt: toIsoStringRequired(issue.createdAt),
    updatedAt: toIsoStringRequired(issue.updatedAt),
  };
}

function mapComment(comment: {
  id: string;
  issueId: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return commentSchema.parse({
    id: comment.id,
    issueId: comment.issueId,
    author: mapUserSummary(comment.author),
    content: comment.content,
    createdAt: toIsoStringRequired(comment.createdAt),
    updatedAt: toIsoStringRequired(comment.updatedAt),
  });
}

function applyIssueFilters<TIssue extends ReturnType<typeof mapIssueSummary>>(
  issues: readonly TIssue[],
  filters: {
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
    sprintId?: string;
    assigneeId?: string;
    labelId?: string;
  },
) {
  return issues.filter((issue) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const haystack = `${issue.key} ${issue.title} ${issue.description ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.status && issue.status !== filters.status) {
      return false;
    }

    if (filters.priority && issue.priority !== filters.priority) {
      return false;
    }

    if (filters.type && issue.type !== filters.type) {
      return false;
    }

    if (filters.sprintId && issue.sprintId !== filters.sprintId) {
      return false;
    }

    if (filters.assigneeId && issue.assignee?.id !== filters.assigneeId) {
      return false;
    }

    if (filters.labelId && !issue.labels.some((label) => label.id === filters.labelId)) {
      return false;
    }

    return true;
  });
}

function sortIssues<TIssue extends ReturnType<typeof mapIssueSummary>>(
  issues: readonly TIssue[],
  sortBy: string,
  direction: "asc" | "desc",
) {
  const factor = direction === "asc" ? 1 : -1;

  return [...issues].sort((left, right) => {
    let result = 0;

    switch (sortBy) {
      case "number":
        result = left.number - right.number;
        break;
      case "title":
        result = left.title.localeCompare(right.title);
        break;
      case "priority":
        result = left.priority.localeCompare(right.priority);
        break;
      case "status":
        result = left.status.localeCompare(right.status);
        break;
      case "type":
        result = left.type.localeCompare(right.type);
        break;
      case "storyPoints":
        result = (left.storyPoints ?? -1) - (right.storyPoints ?? -1);
        break;
      case "dueDate":
        result = (left.dueDate ?? "").localeCompare(right.dueDate ?? "");
        break;
      default:
        result = left.updatedAt.localeCompare(right.updatedAt);
        break;
    }

    return result * factor;
  });
}

async function validateProjectAssociations(input: {
  projectId: string;
  assigneeId?: string | null;
  labelIds?: string[];
  sprintId?: string | null;
}) {
  const [members, labels, sprints] = await Promise.all([
    issuesRepository.listProjectMembers(input.projectId),
    issuesRepository.listProjectLabels(input.projectId),
    issuesRepository.listProjectSprints(input.projectId),
  ]);

  if (input.assigneeId) {
    ensure(
      members.some((member) => member.member.id === input.assigneeId),
      preconditionFailed("Assignee must belong to the project"),
    );
  }

  if (input.labelIds && input.labelIds.length > 0) {
    const knownLabels = new Set(labels.map((label) => label.id));
    ensure(
      input.labelIds.every((labelId) => knownLabels.has(labelId)),
      preconditionFailed("Labels must belong to the project"),
    );
  }

  if (input.sprintId) {
    ensure(
      sprints.some((sprint) => sprint.id === input.sprintId),
      preconditionFailed("Sprint must belong to the project"),
    );
  }
}

async function validateBoardPlacement(input: {
  projectId: string;
  boardId: string;
  columnId?: string | null;
}) {
  const board = await boardsRepository.findById(input.boardId);
  ensure(board, notFound("Board not found"));
  ensure(board.projectId === input.projectId, preconditionFailed("Board must belong to the project"));

  const targetColumn =
    input.columnId === undefined
      ? undefined
      : board.columns.find((column) => column.id === input.columnId) ?? null;

  if (input.columnId !== undefined && input.columnId !== null) {
    ensure(targetColumn, preconditionFailed("Column must belong to the board"));
  }

  return { board, targetColumn };
}

export const issuesService = {
  async listIssues(userId: string, projectId: string, query: unknown) {
    await requireProjectMember(userId, projectId);
    const filters = parseWithSchema(issueListQuerySchema, query);
    const issueRows = await issuesRepository.listByProject(projectId);
    const mapped = issueRows.map((issue) => mapIssueSummary(issue));
    const filtered = applyIssueFilters(mapped, {
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.sprintId ? { sprintId: filters.sprintId } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.labelId ? { labelId: filters.labelId } : {}),
    });
    const sorted = sortIssues(filtered, filters.sortBy, filters.sortDirection);
    const start = (filters.page - 1) * filters.pageSize;
    const items = sorted.slice(start, start + filters.pageSize);
    const pageCount = Math.ceil(sorted.length / filters.pageSize);

    return issueListResponseSchema.parse({
      items,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: sorted.length,
        pageCount,
      },
    });
  },

  async getIssue(userId: string, issueId: string) {
    const issue = await issuesRepository.findById(issueId);
    ensure(issue, notFound("Issue not found"));
    await requireProjectMember(userId, issue.projectId);

    return issueDetailSchema.parse({
      ...mapIssueSummary(issue),
      comments: issue.comments.map((comment) => mapComment(comment)),
      activity: issue.activityLogs.map((activity) => mapActivityItem(activity)),
    });
  },

  async createIssue(userId: string, projectId: string, payload: unknown, requestId: string) {
    await requireProjectMember(userId, projectId);
    const values = parseWithSchema(createIssueSchema, payload);
    const { targetColumn } = await validateBoardPlacement({
      projectId,
      boardId: values.boardId,
      ...(values.columnId !== undefined ? { columnId: values.columnId } : {}),
    });

    await validateProjectAssociations({
      projectId,
      assigneeId: values.assigneeId ?? null,
      labelIds: values.labelIds,
      sprintId: values.sprintId ?? null,
    });

    const status = targetColumn ? inferStatusFromColumnName(targetColumn.name) ?? values.status : values.status;
    const issueId = await issuesRepository.createIssue({
      projectId,
      reporterId: userId,
      values: {
        ...values,
        status,
      },
      requestId,
    });

    return this.getIssue(userId, issueId);
  },

  async updateIssue(userId: string, issueId: string, payload: unknown, requestId: string) {
    const existing = await issuesRepository.findById(issueId);
    ensure(existing, notFound("Issue not found"));
    await requireProjectMember(userId, existing.projectId);

    const values = parseWithSchema(updateIssueSchema, payload);
    ensure(values.version === existing.version, conflict("Issue version is stale"));

    const boardId = values.boardId ?? existing.boardId;
    const columnId = values.columnId !== undefined ? values.columnId : existing.columnId;
    const { targetColumn } = await validateBoardPlacement({
      projectId: existing.projectId,
      boardId,
      ...(columnId !== undefined ? { columnId } : {}),
    });

    const status =
      values.status ??
      (targetColumn ? inferStatusFromColumnName(targetColumn.name) ?? existing.status : existing.status);

    await validateProjectAssociations({
      projectId: existing.projectId,
      assigneeId:
        values.assigneeId !== undefined ? values.assigneeId : existing.assignee?.id ?? null,
      labelIds: values.labelIds ?? existing.labels.map((label) => label.label.id),
      sprintId: values.sprintId !== undefined ? values.sprintId : existing.sprintId,
    });

    const updated = await issuesRepository.updateIssue({
      issueId,
      actorId: userId,
      currentVersion: existing.version,
      nextValues: {
        ...values,
        boardId,
        columnId,
        status,
      },
      requestId,
    });

    ensure(updated, conflict("Issue version is stale"));
    return this.getIssue(userId, issueId);
  },

  async deleteIssue(userId: string, issueId: string) {
    const existing = await issuesRepository.findById(issueId);
    ensure(existing, notFound("Issue not found"));
    const membership = await requireProjectMember(userId, existing.projectId);
    if (existing.reporter.id !== userId && membership !== "admin") {
      throw forbidden("Reporter or admin access required");
    }

    const deleted = await issuesRepository.deleteIssue(issueId);
    ensure(deleted[0], notFound("Issue not found"));

    return {
      id: deleted[0].id,
      deletedAt: new Date().toISOString(),
    };
  },

  async moveIssue(userId: string, issueId: string, payload: unknown, requestId: string) {
    const existing = await issuesRepository.findById(issueId);
    ensure(existing, notFound("Issue not found"));
    await requireProjectMember(userId, existing.projectId);

    const values = parseWithSchema(moveIssueSchema, payload);
    ensure(values.version === existing.version, conflict("Issue version is stale"));

    const { targetColumn } = await validateBoardPlacement({
      projectId: existing.projectId,
      boardId: values.boardId,
      columnId: values.columnId,
    });

    const moved = await issuesRepository.moveIssue({
      issueId,
      actorId: userId,
      values: {
        ...values,
        status: targetColumn ? inferStatusFromColumnName(targetColumn.name) ?? existing.status : existing.status,
      },
      requestId,
    });

    ensure(moved, conflict("Issue version is stale"));
    return this.getIssue(userId, issueId);
  },

  async reorderIssues(userId: string, payload: unknown, requestId: string) {
    const values = parseWithSchema(reorderIssuesSchema, payload);
    const board = await boardsRepository.findById(values.boardId);
    ensure(board, notFound("Board not found"));
    await requireProjectMember(userId, board.projectId);

    await issuesRepository.reorderIssues({
      values,
    });

    return {
      boardId: values.boardId,
      columnId: values.columnId,
      issueIds: values.issueIds,
    };
  },

  async listComments(userId: string, issueId: string) {
    const issue = await issuesRepository.findById(issueId);
    ensure(issue, notFound("Issue not found"));
    await requireProjectMember(userId, issue.projectId);

    return issue.comments.map((comment) => mapComment(comment));
  },

  async createComment(userId: string, issueId: string, payload: unknown, requestId: string) {
    const issue = await issuesRepository.findById(issueId);
    ensure(issue, notFound("Issue not found"));
    await requireProjectMember(userId, issue.projectId);

    const values = parseWithSchema(createCommentSchema, payload);
    const commentId = await issuesRepository.createComment({
      issueId,
      authorId: userId,
      content: values.content,
      requestId,
    });

    const updated = await issuesRepository.findComment(commentId);
    ensure(updated, notFound("Comment not found"));
    return mapComment(updated);
  },

  async updateComment(userId: string, commentId: string, payload: unknown) {
    const existing = await issuesRepository.findComment(commentId);
    ensure(existing, notFound("Comment not found"));
    const membership = await getProjectMembership(userId, existing.issue.projectId);
    ensure(membership, notFound("Project not found"));
    if (existing.authorId !== userId && membership !== "admin") {
      throw forbidden("Comment author or admin access required");
    }

    const values = parseWithSchema(updateCommentSchema, payload);
    await issuesRepository.updateComment(commentId, values);

    const updated = await issuesRepository.findComment(commentId);
    ensure(updated, notFound("Comment not found"));
    return mapComment(updated);
  },

  async deleteComment(userId: string, commentId: string) {
    const existing = await issuesRepository.findComment(commentId);
    ensure(existing, notFound("Comment not found"));
    const membership = await getProjectMembership(userId, existing.issue.projectId);
    ensure(membership, notFound("Project not found"));
    if (existing.authorId !== userId && membership !== "admin") {
      throw forbidden("Comment author or admin access required");
    }

    const deleted = await issuesRepository.deleteComment(commentId);
    ensure(deleted[0], notFound("Comment not found"));
    return {
      id: deleted[0].id,
      deletedAt: new Date().toISOString(),
    };
  },

  async listActivity(userId: string, issueId: string) {
    const issue = await issuesRepository.findById(issueId);
    ensure(issue, notFound("Issue not found"));
    await requireProjectMember(userId, issue.projectId);

    return issue.activityLogs.map((activity) => mapActivityItem(activity));
  },

  async listProjectActivity(userId: string, projectId: string, limit = 20) {
    await requireProjectMember(userId, projectId);
    const activity = await issuesRepository.listProjectActivity(projectId, limit);
    return activity.map((entry) => mapActivityItem(entry));
  },
};
