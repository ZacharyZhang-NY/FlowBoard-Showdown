import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db/index";
import { activityLogs, issues, issueStateHistory, sprints } from "@/db/schema";
import type {
  CreateSprintRequest,
  UpdateSprintRequest,
} from "@/src/modules/sprints/contract/sprint.schemas";

export const sprintsRepository = {
  listByProject(projectId: string) {
    return db.query.sprints.findMany({
      where: eq(sprints.projectId, projectId),
      with: {
        issues: {
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
          orderBy: (issue, operators) => [operators.asc(issue.position)],
        },
      },
      orderBy: (sprint, operators) => [
        operators.asc(sprint.status),
        operators.desc(sprint.createdAt),
      ],
    });
  },

  findById(sprintId: string) {
    return db.query.sprints.findFirst({
      where: eq(sprints.id, sprintId),
      with: {
        issues: {
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
          orderBy: (issue, operators) => [operators.asc(issue.position)],
        },
      },
    });
  },

  create(projectId: string, values: CreateSprintRequest) {
    return db
      .insert(sprints)
      .values({
        projectId,
        name: values.name,
        goal: values.goal ?? null,
        status: "planning",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  },

  update(sprintId: string, values: UpdateSprintRequest) {
    return db
      .update(sprints)
      .set({
        name: values.name,
        goal: values.goal ?? null,
        updatedAt: new Date(),
      })
      .where(eq(sprints.id, sprintId))
      .returning();
  },

  findActiveSprint(projectId: string, excludeSprintId?: string) {
    return db.query.sprints.findFirst({
      where: and(
        eq(sprints.projectId, projectId),
        eq(sprints.status, "active"),
        excludeSprintId ? ne(sprints.id, excludeSprintId) : undefined,
      ),
    });
  },

  async startSprint(input: {
    sprintId: string;
    actorId: string;
    startDate: Date;
    endDate: Date;
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const sprint = tx
        .update(sprints)
        .set({
          status: "active",
          startDate: input.startDate,
          endDate: input.endDate,
          updatedAt: new Date(),
        })
        .where(eq(sprints.id, input.sprintId))
        .returning()
        .get();

      if (sprint) {
        tx.insert(activityLogs).values({
          projectId: sprint.projectId,
          issueId: null,
          actorId: input.actorId,
          action: "sprint_started",
          requestId: input.requestId,
          oldValue: null,
          newValue: JSON.stringify({
            sprintId: sprint.id,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
          }),
          createdAt: new Date(),
        }).run();
      }

      return sprint;
    });
  },

  async completeSprint(input: {
    sprintId: string;
    actorId: string;
    moveIncompleteIssuesToBacklog: boolean;
    requestId: string;
  }) {
    return db.transaction((tx) => {
      const sprint = tx.query.sprints.findFirst({
        where: eq(sprints.id, input.sprintId),
        with: {
          issues: true,
        },
      }).sync();
      if (!sprint) {
        return null;
      }

      const now = new Date();
      tx
        .update(sprints)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(eq(sprints.id, input.sprintId))
        .run();

      if (input.moveIncompleteIssuesToBacklog) {
        const incompleteIssues = sprint.issues.filter((issue) => issue.status !== "done");

        for (const issue of incompleteIssues) {
          tx
            .update(issues)
            .set({
              sprintId: null,
              updatedAt: now,
            })
            .where(eq(issues.id, issue.id))
            .run();

          tx.insert(issueStateHistory).values({
            issueId: issue.id,
            projectId: issue.projectId,
            sprintId: null,
            status: issue.status,
            storyPoints: issue.storyPoints,
            recordedAt: now,
          }).run();
        }
      }

      tx.insert(activityLogs).values({
        projectId: sprint.projectId,
        issueId: null,
        actorId: input.actorId,
        action: "sprint_completed",
        requestId: input.requestId,
        oldValue: null,
        newValue: JSON.stringify({
          sprintId: sprint.id,
          movedIncompleteIssuesToBacklog: input.moveIncompleteIssuesToBacklog,
        }),
        createdAt: now,
      }).run();

      return sprint.id;
    });
  },
};
