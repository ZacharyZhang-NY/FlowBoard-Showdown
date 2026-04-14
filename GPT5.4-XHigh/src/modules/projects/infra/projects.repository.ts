import { and, eq } from "drizzle-orm";

import { db } from "@/db/index";
import {
  activityLogs,
  boards,
  columns,
  issueStateHistory,
  projectCounters,
  projectMembers,
  projects,
  sprints,
} from "@/db/schema";
import type { CreateProjectRequest, UpdateProjectRequest } from "@/src/modules/projects/contract/project.schemas";
import { buildOrderedPositions } from "@/src/shared/utils/ordering";

export const projectsRepository = {
  listAccessible(userId: string) {
    return db.query.projectMembers.findMany({
      where: eq(projectMembers.userId, userId),
      with: {
        project: {
          with: {
            creator: true,
            boards: true,
            issues: true,
            sprints: true,
          },
        },
      },
      orderBy: (members, operators) => [operators.asc(members.createdAt)],
    });
  },

  findAccessible(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
      with: {
        project: {
          with: {
            creator: true,
            boards: true,
            issues: true,
            sprints: true,
            labels: true,
            members: {
              with: {
                member: true,
              },
            },
          },
        },
      },
    });
  },

  findActivity(projectId: string, limit = 20) {
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
      orderBy: (logs, operators) => [operators.desc(logs.createdAt)],
      limit,
    });
  },

  async createWithDefaults(input: {
    userId: string;
    values: CreateProjectRequest;
    defaultBoardName?: string;
    defaultColumns: ReadonlyArray<{
      name: string;
      color: string;
      wipLimit: number | null;
    }>;
  }) {
    return db.transaction((tx) => {
      const createdAt = new Date();

      const project = tx
        .insert(projects)
        .values({
          name: input.values.name,
          key: input.values.key,
          description: input.values.description ?? null,
          createdBy: input.userId,
          createdAt,
          updatedAt: createdAt,
        })
        .returning()
        .get();
      if (!project) {
        throw new Error("Project insert failed");
      }

      const board = tx
        .insert(boards)
        .values({
          projectId: project.id,
          name: input.defaultBoardName ?? "Main Board",
          position: 1_000,
          createdAt,
          updatedAt: createdAt,
        })
        .returning()
        .get();
      if (!board) {
        throw new Error("Board insert failed");
      }

      tx.insert(projectMembers).values({
        projectId: project.id,
        userId: input.userId,
        role: "admin",
        createdAt,
      }).run();

      tx.insert(projectCounters).values({
        projectId: project.id,
        nextIssueNumber: 1,
        updatedAt: createdAt,
      }).run();

      const columnPositions = buildOrderedPositions(
        input.defaultColumns.map((column) => column.name),
      );

      tx.insert(columns).values(
        input.defaultColumns.map((column) => ({
          boardId: board.id,
          name: column.name,
          color: column.color,
          wipLimit: column.wipLimit,
          position: columnPositions.get(column.name) ?? 1_000,
          createdAt,
          updatedAt: createdAt,
        })),
      ).run();

      return project.id;
    });
  },

  update(projectId: string, values: UpdateProjectRequest) {
    const nextValues = {
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.key !== undefined ? { key: values.key } : {}),
      ...(values.description !== undefined ? { description: values.description } : {}),
      updatedAt: new Date(),
    };

    return db
      .update(projects)
      .set(nextValues)
      .where(eq(projects.id, projectId))
      .returning();
  },

  delete(projectId: string) {
    return db.delete(projects).where(eq(projects.id, projectId)).returning();
  },

  listSprints(projectId: string) {
    return db.query.sprints.findMany({
      where: eq(sprints.projectId, projectId),
      with: {
        issues: true,
      },
      orderBy: (sprint, operators) => [
        operators.desc(sprint.endDate),
        operators.desc(sprint.createdAt),
      ],
    });
  },

  listIssueStateHistory(projectId: string) {
    return db.query.issueStateHistory.findMany({
      where: eq(issueStateHistory.projectId, projectId),
      orderBy: (history, operators) => [operators.asc(history.recordedAt)],
    });
  },
};
