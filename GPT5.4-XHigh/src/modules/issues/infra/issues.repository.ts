import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/index";
import {
  activityLogs,
  comments,
  issueLabels,
  issues,
  issueStateHistory,
  labels,
  projectCounters,
  projectMembers,
  sprints,
} from "@/db/schema";
import type {
  CreateCommentRequest,
  CreateIssueRequest,
  MoveIssueRequest,
  ReorderIssuesRequest,
  UpdateCommentRequest,
  UpdateIssueRequest,
} from "@/src/modules/issues/contract/issue.schemas";
import {
  buildOrderedPositions,
  buildTemporaryPositions,
  clampIndex,
  nextPosition,
} from "@/src/shared/utils/ordering";

export const issuesRepository = {
  listByProject(projectId: string) {
    return db.query.issues.findMany({
      where: eq(issues.projectId, projectId),
      with: {
        project: true,
        board: true,
        column: true,
        sprint: true,
        assignee: true,
        reporter: true,
        labels: {
          with: {
            label: true,
          },
        },
      },
      orderBy: (issue, operators) => [operators.asc(issue.number)],
    });
  },

  findById(issueId: string) {
    return db.query.issues.findFirst({
      where: eq(issues.id, issueId),
      with: {
        project: true,
        board: true,
        column: true,
        sprint: true,
        assignee: true,
        reporter: true,
        labels: {
          with: {
            label: true,
          },
        },
        comments: {
          with: {
            author: true,
          },
          orderBy: (comment, operators) => [operators.asc(comment.createdAt)],
        },
        activityLogs: {
          with: {
            actor: true,
            issue: {
              with: {
                project: true,
              },
            },
          },
          orderBy: (log, operators) => [operators.desc(log.createdAt)],
        },
      },
    });
  },

  findComment(commentId: string) {
    return db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      with: {
        issue: true,
        author: true,
      },
    });
  },

  listProjectMembers(projectId: string) {
    return db.query.projectMembers.findMany({
      where: eq(projectMembers.projectId, projectId),
      with: {
        member: true,
      },
    });
  },

  listProjectLabels(projectId: string) {
    return db.query.labels.findMany({
      where: eq(labels.projectId, projectId),
      orderBy: (label, operators) => [operators.asc(label.name)],
    });
  },

  listProjectSprints(projectId: string) {
    return db.query.sprints.findMany({
      where: eq(sprints.projectId, projectId),
      orderBy: (sprint, operators) => [operators.desc(sprint.createdAt)],
    });
  },

  async createIssue(input: {
    projectId: string;
    reporterId: string;
    values: CreateIssueRequest;
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const createdAt = new Date();
      const counter = tx
        .select()
        .from(projectCounters)
        .where(eq(projectCounters.projectId, input.projectId))
        .get();

      const nextIssueNumber = counter?.nextIssueNumber ?? 1;

      const columnIssues = tx.query.issues.findMany({
        where: and(
          eq(issues.boardId, input.values.boardId),
          input.values.columnId === null || input.values.columnId === undefined
            ? isNull(issues.columnId)
            : eq(issues.columnId, input.values.columnId),
        ),
        orderBy: (issue, operators) => [operators.asc(issue.position)],
      }).sync();

      const issue = tx
        .insert(issues)
        .values({
          projectId: input.projectId,
          boardId: input.values.boardId,
          columnId: input.values.columnId ?? null,
          sprintId: input.values.sprintId ?? null,
          number: nextIssueNumber,
          title: input.values.title,
          description: input.values.description ?? null,
          status: input.values.status,
          priority: input.values.priority,
          type: input.values.type,
          assigneeId: input.values.assigneeId ?? null,
          reporterId: input.reporterId,
          position: nextPosition(columnIssues.map((issue) => issue.position)),
          storyPoints: input.values.storyPoints ?? null,
          dueDate: input.values.dueDate ? new Date(input.values.dueDate) : null,
          version: 1,
          createdAt,
          updatedAt: createdAt,
        })
        .returning()
        .get();
      if (!issue) {
        throw new Error("Issue insert failed");
      }

      if (input.values.labelIds.length > 0) {
        tx.insert(issueLabels).values(
          input.values.labelIds.map((labelId) => ({
            issueId: issue.id,
            labelId,
          })),
        ).run();
      }

      tx
        .update(projectCounters)
        .set({
          nextIssueNumber: nextIssueNumber + 1,
          updatedAt: createdAt,
        })
        .where(eq(projectCounters.projectId, input.projectId))
        .run();

      tx.insert(activityLogs).values({
        projectId: input.projectId,
        issueId: issue.id,
        actorId: input.reporterId,
        action: "issue_created",
        requestId: input.requestId,
        oldValue: null,
        newValue: JSON.stringify({
          title: input.values.title,
          status: input.values.status,
        }),
        createdAt,
      }).run();

      tx.insert(issueStateHistory).values({
        issueId: issue.id,
        projectId: input.projectId,
        sprintId: input.values.sprintId ?? null,
        status: input.values.status,
        storyPoints: input.values.storyPoints ?? null,
        recordedAt: createdAt,
      }).run();

      return issue.id;
    });
  },

  async updateIssue(input: {
    issueId: string;
    actorId: string;
    currentVersion: number;
    nextValues: Omit<UpdateIssueRequest, "version">;
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const existing = tx.query.issues.findFirst({
        where: eq(issues.id, input.issueId),
      }).sync();
      if (!existing || existing.version !== input.currentVersion) {
        return null;
      }

      const now = new Date();
      tx
        .update(issues)
        .set({
          boardId: input.nextValues.boardId ?? existing.boardId,
          columnId:
            input.nextValues.columnId !== undefined
              ? input.nextValues.columnId
              : existing.columnId,
          sprintId:
            input.nextValues.sprintId !== undefined
              ? input.nextValues.sprintId
              : existing.sprintId,
          title: input.nextValues.title ?? existing.title,
          description:
            input.nextValues.description !== undefined
              ? input.nextValues.description
              : existing.description,
          status: input.nextValues.status ?? existing.status,
          priority: input.nextValues.priority ?? existing.priority,
          type: input.nextValues.type ?? existing.type,
          assigneeId:
            input.nextValues.assigneeId !== undefined
              ? input.nextValues.assigneeId
              : existing.assigneeId,
          storyPoints:
            input.nextValues.storyPoints !== undefined
              ? input.nextValues.storyPoints
              : existing.storyPoints,
          dueDate:
            input.nextValues.dueDate !== undefined
              ? input.nextValues.dueDate
                ? new Date(input.nextValues.dueDate)
                : null
              : existing.dueDate,
          version: input.currentVersion + 1,
          updatedAt: now,
        })
        .where(eq(issues.id, input.issueId))
        .run();

      if (input.nextValues.labelIds) {
        tx.delete(issueLabels).where(eq(issueLabels.issueId, input.issueId)).run();
        if (input.nextValues.labelIds.length > 0) {
          tx.insert(issueLabels).values(
            input.nextValues.labelIds.map((labelId) => ({
              issueId: input.issueId,
              labelId,
            })),
          ).run();
        }
      }

      tx.insert(activityLogs).values({
        projectId: existing.projectId,
        issueId: existing.id,
        actorId: input.actorId,
        action: "issue_updated",
        requestId: input.requestId,
        oldValue: JSON.stringify({
          version: existing.version,
        }),
        newValue: JSON.stringify({
          version: input.currentVersion + 1,
        }),
        createdAt: now,
      }).run();

      tx.insert(issueStateHistory).values({
        issueId: existing.id,
        projectId: existing.projectId,
        sprintId:
          input.nextValues.sprintId !== undefined
            ? input.nextValues.sprintId
            : existing.sprintId,
        status: input.nextValues.status ?? existing.status,
        storyPoints:
          input.nextValues.storyPoints !== undefined
            ? input.nextValues.storyPoints
            : existing.storyPoints,
        recordedAt: now,
      }).run();

      return existing.id;
    });
  },

  async moveIssue(input: {
    issueId: string;
    actorId: string;
    values: MoveIssueRequest & {
      status: UpdateIssueRequest["status"];
    };
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const movingIssue = tx.query.issues.findFirst({
        where: eq(issues.id, input.issueId),
      }).sync();
      if (!movingIssue || movingIssue.version !== input.values.version) {
        return null;
      }

      const targetIssues = tx.query.issues.findMany({
        where: and(
          eq(issues.boardId, input.values.boardId),
          input.values.columnId === null
            ? isNull(issues.columnId)
            : eq(issues.columnId, input.values.columnId),
        ),
        orderBy: (issue, operators) => [operators.asc(issue.position)],
      }).sync();

      const filteredIds = targetIssues
        .filter((issue) => issue.id !== movingIssue.id)
        .map((issue) => issue.id);
      const targetIndex = clampIndex(input.values.position, filteredIds.length);
      filteredIds.splice(targetIndex, 0, movingIssue.id);
      const positions = buildOrderedPositions(filteredIds);
      const temporaryPositions = buildTemporaryPositions(filteredIds);
      const now = new Date();

      for (const orderedIssueId of filteredIds) {
        tx
          .update(issues)
          .set({
            boardId: input.values.boardId,
            columnId: input.values.columnId,
            position: temporaryPositions.get(orderedIssueId) ?? -1_000,
            updatedAt: now,
            ...(orderedIssueId === movingIssue.id
              ? {
                  status: input.values.status,
                  version: movingIssue.version + 1,
                }
              : {}),
          })
          .where(eq(issues.id, orderedIssueId))
          .run();
      }

      for (const orderedIssueId of filteredIds) {
        tx
          .update(issues)
          .set({
            position: positions.get(orderedIssueId) ?? 1_000,
            updatedAt: now,
          })
          .where(eq(issues.id, orderedIssueId))
          .run();
      }

      tx.insert(activityLogs).values({
        projectId: movingIssue.projectId,
        issueId: movingIssue.id,
        actorId: input.actorId,
        action: "issue_moved",
        requestId: input.requestId,
        oldValue: JSON.stringify({
          columnId: movingIssue.columnId,
          position: movingIssue.position,
        }),
        newValue: JSON.stringify({
          columnId: input.values.columnId,
          position: positions.get(movingIssue.id) ?? 1_000,
          status: input.values.status,
        }),
        createdAt: now,
      }).run();

      tx.insert(issueStateHistory).values({
        issueId: movingIssue.id,
        projectId: movingIssue.projectId,
        sprintId: movingIssue.sprintId,
        status: input.values.status ?? movingIssue.status,
        storyPoints: movingIssue.storyPoints,
        recordedAt: now,
      }).run();

      return movingIssue.id;
    });
  },

  async reorderIssues(input: {
    values: ReorderIssuesRequest;
  }) {
    const positions = buildOrderedPositions(input.values.issueIds);
    const temporaryPositions = buildTemporaryPositions(input.values.issueIds);
    const now = new Date();

    db.transaction((tx) => {
      for (const issueId of input.values.issueIds) {
        tx
          .update(issues)
          .set({
            boardId: input.values.boardId,
            columnId: input.values.columnId,
            position: temporaryPositions.get(issueId) ?? -1_000,
            updatedAt: now,
          })
          .where(eq(issues.id, issueId))
          .run();
      }

      for (const issueId of input.values.issueIds) {
        tx
          .update(issues)
          .set({
            position: positions.get(issueId) ?? 1_000,
            updatedAt: now,
          })
          .where(eq(issues.id, issueId))
          .run();
      }
    });
  },

  async deleteIssue(issueId: string) {
    return db.delete(issues).where(eq(issues.id, issueId)).returning();
  },

  listComments(issueId: string) {
    return db.query.comments.findMany({
      where: eq(comments.issueId, issueId),
      with: {
        author: true,
      },
      orderBy: (comment, operators) => [operators.asc(comment.createdAt)],
    });
  },

  async createComment(input: {
    issueId: string;
    authorId: string;
    content: string;
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const now = new Date();
      const issue = tx
        .select({
          projectId: issues.projectId,
        })
        .from(issues)
        .where(eq(issues.id, input.issueId))
        .get();

      const comment = tx
        .insert(comments)
        .values({
          issueId: input.issueId,
          authorId: input.authorId,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      if (!comment) {
        throw new Error("Comment insert failed");
      }

      if (issue) {
        tx.insert(activityLogs).values({
          projectId: issue.projectId,
          issueId: input.issueId,
          actorId: input.authorId,
          action: "issue_commented",
          requestId: input.requestId,
          oldValue: null,
          newValue: JSON.stringify({ commentId: comment.id }),
          createdAt: now,
        }).run();
      }

      return comment.id;
    });
  },

  async updateComment(commentId: string, values: { content: string }) {
    return db
      .update(comments)
      .set({
        content: values.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();
  },

  deleteComment(commentId: string) {
    return db.delete(comments).where(eq(comments.id, commentId)).returning();
  },

  listActivity(issueId: string) {
    return db.query.activityLogs.findMany({
      where: eq(activityLogs.issueId, issueId),
      with: {
        actor: true,
        issue: {
          with: {
            project: true,
          },
        },
      },
      orderBy: (activity, operators) => [operators.desc(activity.createdAt)],
    });
  },

  listProjectActivity(projectId: string, limit = 20) {
    return db.query.activityLogs.findMany({
      where: eq(activityLogs.projectId, projectId),
      with: {
        actor: true,
        issue: {
          with: {
            project: true,
          },
        },
      },
      orderBy: (activity, operators) => [operators.desc(activity.createdAt)],
      limit,
    });
  },
};
