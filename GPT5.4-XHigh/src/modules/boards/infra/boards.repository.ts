import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/index";
import { boards, columns, issues } from "@/db/schema";
import type {
  CreateBoardRequest,
  CreateColumnRequest,
  UpdateBoardRequest,
  UpdateColumnRequest,
} from "@/src/modules/boards/contract/board.schemas";
import {
  buildOrderedPositions,
  buildTemporaryPositions,
  nextPosition,
} from "@/src/shared/utils/ordering";

export const boardsRepository = {
  listByProject(projectId: string) {
    return db.query.boards.findMany({
      where: eq(boards.projectId, projectId),
      with: {
        issues: true,
      },
      orderBy: (board, operators) => [operators.asc(board.position)],
    });
  },

  findById(boardId: string) {
    return db.query.boards.findFirst({
      where: eq(boards.id, boardId),
      with: {
        project: true,
        columns: {
          orderBy: (column, operators) => [operators.asc(column.position)],
        },
        issues: {
          with: {
            assignee: true,
            reporter: true,
            labels: {
              with: {
                label: true,
              },
            },
          },
          orderBy: (issue, operators) => [operators.asc(issue.position)],
        },
      },
    });
  },

  create(projectId: string, values: CreateBoardRequest) {
    return db.transaction((tx) => {
      const lastBoard = tx
        .select({
          position: boards.position,
        })
        .from(boards)
        .where(eq(boards.projectId, projectId))
        .orderBy(desc(boards.position))
        .get();

      const board = tx
        .insert(boards)
        .values({
          projectId,
          name: values.name,
          position: nextPosition(lastBoard ? [lastBoard.position] : []),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .get();
      if (!board) {
        throw new Error("Board insert failed");
      }

      return board.id;
    });
  },

  update(boardId: string, values: UpdateBoardRequest) {
    return db
      .update(boards)
      .set({
        name: values.name,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning();
  },

  delete(boardId: string) {
    return db.delete(boards).where(eq(boards.id, boardId)).returning();
  },

  createColumn(boardId: string, values: CreateColumnRequest) {
    return db.transaction((tx) => {
      const currentColumns = tx.query.columns.findMany({
        where: eq(columns.boardId, boardId),
        orderBy: (column, operators) => [operators.asc(column.position)],
      }).sync();

      const column = tx
        .insert(columns)
        .values({
          boardId,
          name: values.name,
          color: values.color,
          wipLimit: values.wipLimit ?? null,
          position: nextPosition(currentColumns.map((entry) => entry.position)),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .get();
      if (!column) {
        throw new Error("Column insert failed");
      }

      return column.id;
    });
  },

  updateColumn(columnId: string, values: UpdateColumnRequest) {
    const nextValues = {
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.color !== undefined ? { color: values.color } : {}),
      ...(values.wipLimit !== undefined ? { wipLimit: values.wipLimit } : {}),
      ...(values.position !== undefined ? { position: values.position } : {}),
      updatedAt: new Date(),
    };

    return db
      .update(columns)
      .set(nextValues)
      .where(eq(columns.id, columnId))
      .returning();
  },

  async reorderColumns(boardId: string, columnIds: string[]) {
    const positions = buildOrderedPositions(columnIds);
    const temporaryPositions = buildTemporaryPositions(columnIds);

    db.transaction((tx) => {
      for (const columnId of columnIds) {
        tx
          .update(columns)
          .set({
            position: temporaryPositions.get(columnId) ?? -1_000,
            updatedAt: new Date(),
          })
          .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)))
          .run();
      }

      for (const columnId of columnIds) {
        tx
          .update(columns)
          .set({
            position: positions.get(columnId) ?? 1_000,
            updatedAt: new Date(),
          })
          .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)))
          .run();
      }
    });
  },

  findColumn(columnId: string) {
    return db.query.columns.findFirst({
      where: eq(columns.id, columnId),
      with: {
        board: {
          with: {
            columns: {
              orderBy: (column, operators) => [operators.asc(column.position)],
            },
            issues: {
              orderBy: (issue, operators) => [operators.asc(issue.position)],
            },
          },
        },
      },
    });
  },

  async moveIssuesToColumn(issueIds: string[], targetColumnId: string | null) {
    if (issueIds.length === 0) {
      return;
    }

    if (targetColumnId === null) {
      await db
        .update(issues)
        .set({
          columnId: null,
          updatedAt: new Date(),
        })
        .where(inArray(issues.id, issueIds));
      return;
    }

    db.transaction((tx) => {
      const movingIssues = tx.query.issues.findMany({
        where: inArray(issues.id, issueIds),
        orderBy: (issue, operators) => [operators.asc(issue.position)],
      }).sync();
      if (movingIssues.length === 0) {
        return;
      }

      const targetIssues = tx.query.issues.findMany({
        where: and(
          eq(issues.boardId, movingIssues[0]!.boardId),
          eq(issues.columnId, targetColumnId),
        ),
        orderBy: (issue, operators) => [operators.asc(issue.position)],
      }).sync();

      const orderedIds = [
        ...targetIssues.map((issue) => issue.id),
        ...movingIssues.map((issue) => issue.id),
      ];
      const temporaryPositions = buildTemporaryPositions(orderedIds);
      const finalPositions = buildOrderedPositions(orderedIds);
      const now = new Date();

      for (const issueId of orderedIds) {
        tx
          .update(issues)
          .set({
            columnId: targetColumnId,
            position: temporaryPositions.get(issueId) ?? -1_000,
            updatedAt: now,
          })
          .where(eq(issues.id, issueId))
          .run();
      }

      for (const issueId of orderedIds) {
        tx
          .update(issues)
          .set({
            position: finalPositions.get(issueId) ?? 1_000,
            updatedAt: now,
          })
          .where(eq(issues.id, issueId))
          .run();
      }
    });
  },

  deleteColumn(columnId: string) {
    return db.delete(columns).where(eq(columns.id, columnId)).returning();
  },
};
