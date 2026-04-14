import {
  burndownResponseSchema,
  cumulativeFlowResponseSchema,
  distributionResponseSchema,
  priorityBreakdownResponseSchema,
  velocityResponseSchema,
} from "@/src/modules/reports/contract/report.schemas";
import { issuesRepository } from "@/src/modules/issues/infra/issues.repository";
import { projectsRepository } from "@/src/modules/projects/infra/projects.repository";
import { requireProjectMember } from "@/src/shared/auth/authorization";
import { addDays, endOfDay, startOfDay, toIsoStringRequired } from "@/src/shared/utils/date";
import { issuePriorityValues, issueStatusValues } from "@/src/shared/types/domain";

function getDateRange(startDate: Date, endDate: Date) {
  const result: Date[] = [];
  let cursor = startOfDay(startDate);
  const finalDate = startOfDay(endDate);

  while (cursor <= finalDate) {
    result.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return result;
}

export const reportsService = {
  async getBurndown(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const sprints = await projectsRepository.listSprints(projectId);
    const targetSprint =
      sprints.find((sprint) => sprint.status === "active") ??
      sprints.find((sprint) => sprint.status === "completed") ??
      null;

    if (!targetSprint?.startDate || !targetSprint.endDate) {
      return burndownResponseSchema.parse({ ideal: [], actual: [] });
    }

    const history = await projectsRepository.listIssueStateHistory(projectId);
    const sprintIssues = targetSprint.issues;
    const totalStoryPoints = sprintIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints ?? 0),
      0,
    );
    const dates = getDateRange(targetSprint.startDate, targetSprint.endDate);
    const ideal = dates.map((date, index) => ({
      date: toIsoStringRequired(date),
      value:
        dates.length <= 1
          ? totalStoryPoints
          : Math.max(
              0,
              Math.round(totalStoryPoints * (1 - index / (dates.length - 1))),
            ),
    }));

    const actual = dates.map((date) => {
      const cutoff = endOfDay(date).getTime();
      const remaining = sprintIssues.reduce((sum, issue) => {
        const latestState = history
          .filter(
            (entry) =>
              entry.issueId === issue.id &&
              entry.recordedAt.getTime() <= cutoff &&
              entry.sprintId === targetSprint.id,
          )
          .at(-1);

        if (!latestState) {
          return sum + (issue.storyPoints ?? 0);
        }

        if (latestState.status === "done") {
          return sum;
        }

        return sum + (latestState.storyPoints ?? issue.storyPoints ?? 0);
      }, 0);

      return {
        date: toIsoStringRequired(date),
        value: remaining,
      };
    });

    return burndownResponseSchema.parse({ ideal, actual });
  },

  async getVelocity(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const sprints = (await projectsRepository.listSprints(projectId))
      .filter((sprint) => sprint.status !== "planning")
      .slice(0, 5)
      .reverse();

    const items = sprints.map((sprint) => {
      const committed = sprint.issues.reduce(
        (sum, issue) => sum + (issue.storyPoints ?? 0),
        0,
      );
      const completed = sprint.issues
        .filter((issue) => issue.status === "done")
        .reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0);

      return {
        sprintName: sprint.name,
        committed,
        completed,
      };
    });

    return velocityResponseSchema.parse({ items });
  },

  async getDistribution(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const issues = await issuesRepository.listByProject(projectId);
    const items = issueStatusValues.map((status) => ({
      status,
      count: issues.filter((issue) => issue.status === status).length,
    }));

    return distributionResponseSchema.parse({ items });
  },

  async getPriorityBreakdown(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const sprints = (await projectsRepository.listSprints(projectId)).slice(0, 5).reverse();
    const items = sprints.flatMap((sprint) =>
      issuePriorityValues.map((priority) => ({
        sprintName: sprint.name,
        priority,
        count: sprint.issues.filter((issue) => issue.priority === priority).length,
      })),
    );

    return priorityBreakdownResponseSchema.parse({ items });
  },

  async getCumulativeFlow(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const issues = await issuesRepository.listByProject(projectId);
    const history = await projectsRepository.listIssueStateHistory(projectId);
    const dates = getDateRange(addDays(new Date(), -13), new Date());

    const items = dates.flatMap((date) => {
      const cutoff = endOfDay(date).getTime();

      return issueStatusValues.map((status) => ({
        date: toIsoStringRequired(date),
        status,
        count: issues.filter((issue) => {
          const latestState = history
            .filter(
              (entry) => entry.issueId === issue.id && entry.recordedAt.getTime() <= cutoff,
            )
            .at(-1);

          const effectiveStatus = latestState?.status ?? issue.status;
          return effectiveStatus === status;
        }).length,
      }));
    });

    return cumulativeFlowResponseSchema.parse({ items });
  },
};
