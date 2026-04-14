import { eq } from "drizzle-orm";

import { db } from "@/db/index";
import { issues } from "@/db/schema";
import {
  createProjectSchema,
  type DashboardSummary,
  projectDetailSchema,
  projectMemberSchema,
  projectSummarySchema,
  updateProjectSchema,
} from "@/src/modules/projects/contract/project.schemas";
import { projectsRepository } from "@/src/modules/projects/infra/projects.repository";
import { mapActivityItem, mapUserSummary } from "@/src/shared/api/mappers";
import { ensure, notFound } from "@/src/shared/api/errors";
import { parseWithSchema } from "@/src/shared/api/validation";
import { requireProjectAdmin, requireProjectMember } from "@/src/shared/auth/authorization";
import { defaultBoardColumns } from "@/src/shared/constants/board";
import { differenceInCalendarDays, startOfDay, toIsoStringRequired } from "@/src/shared/utils/date";

function mapProjectSummary(project: {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  boards: Array<unknown>;
  issues: Array<{ status: string }>;
}) {
  return projectSummarySchema.parse({
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    createdAt: toIsoStringRequired(project.createdAt),
    updatedAt: toIsoStringRequired(project.updatedAt),
    boardCount: project.boards.length,
    openIssueCount: project.issues.filter((issue) => issue.status !== "done").length,
  });
}

function mapProjectDetail(project: {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  boards: Array<unknown>;
  issues: Array<{ status: string }>;
  creator: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  sprints: Array<{ id: string; status: string }>;
}) {
  return projectDetailSchema.parse({
    ...mapProjectSummary(project),
    createdBy: mapUserSummary(project.creator),
    currentSprintId:
      project.sprints.find((sprint) => sprint.status === "active")?.id ?? null,
  });
}

export const projectsService = {
  async listProjects(userId: string) {
    const memberships = await projectsRepository.listAccessible(userId);
    return memberships.map((membership) => mapProjectSummary(membership.project));
  },

  async getProject(userId: string, projectId: string) {
    const membership = await projectsRepository.findAccessible(projectId, userId);
    ensure(membership, notFound("Project not found"));
    return mapProjectDetail(membership.project);
  },

  async getProjectMembers(userId: string, projectId: string) {
    const membership = await projectsRepository.findAccessible(projectId, userId);
    ensure(membership, notFound("Project not found"));
    return membership.project.members.map((member) =>
      projectMemberSchema.parse({
        projectId,
        role: member.role,
        user: mapUserSummary(member.member),
      }),
    );
  },

  async createProject(userId: string, payload: unknown) {
    const values = parseWithSchema(createProjectSchema, payload);
    const projectId = await projectsRepository.createWithDefaults({
      userId,
      values,
      defaultColumns: defaultBoardColumns,
    });

    return this.getProject(userId, projectId);
  },

  async updateProject(userId: string, projectId: string, payload: unknown) {
    await requireProjectAdmin(userId, projectId);
    const values = parseWithSchema(updateProjectSchema, payload);
    const currentProject = await this.getProject(userId, projectId);

    await projectsRepository.update(projectId, {
      name: values.name ?? currentProject.name,
      key: values.key ?? currentProject.key,
      description:
        values.description !== undefined ? values.description : currentProject.description,
    });

    return this.getProject(userId, projectId);
  },

  async deleteProject(userId: string, projectId: string) {
    await requireProjectAdmin(userId, projectId);
    const deleted = await projectsRepository.delete(projectId);
    ensure(deleted[0], notFound("Project not found"));

    return {
      id: deleted[0].id,
      deletedAt: new Date().toISOString(),
    };
  },

  async getDashboardSummary(userId: string, projectId: string): Promise<DashboardSummary> {
    await requireProjectMember(userId, projectId);

    const membership = await projectsRepository.findAccessible(projectId, userId);
    ensure(membership, notFound("Project not found"));

    const currentDate = startOfDay(new Date());
    const allIssues = await db.query.issues.findMany({
      where: eq(issues.projectId, projectId),
      with: {
        assignee: true,
      },
    });
    const projectActivity = await projectsRepository.findActivity(projectId, 20);

    const openIssues = allIssues.filter((issue) => issue.status !== "done");
    const myAssigned = allIssues.filter((issue) => issue.assigneeId === userId);
    const overdue = allIssues.filter(
      (issue) => issue.dueDate && startOfDay(issue.dueDate) < currentDate && issue.status !== "done",
    );
    const activeSprint = membership.project.sprints.find((sprint) => sprint.status === "active");
    const activeSprintIssues = allIssues.filter((issue) => issue.sprintId === activeSprint?.id);
    const completedStoryPoints = activeSprintIssues
      .filter((issue) => issue.status === "done")
      .reduce((total, issue) => total + (issue.storyPoints ?? 0), 0);
    const totalStoryPoints = activeSprintIssues.reduce(
      (total, issue) => total + (issue.storyPoints ?? 0),
      0,
    );

    const summary = {
      openIssues: {
        label: "Open Issues",
        value: openIssues.length,
        trend: 0,
      },
      myAssigned: {
        label: "My Assigned",
        value: myAssigned.length,
        trend: 0,
      },
      overdue: {
        label: "Overdue",
        value: overdue.length,
        trend: 0,
      },
      activeSprint: {
        id: activeSprint?.id ?? null,
        name: activeSprint?.name ?? null,
        completedStoryPoints,
        totalStoryPoints,
      },
      recentActivity: projectActivity.map((activity) => mapActivityItem(activity)),
    } satisfies DashboardSummary;

    return summary;
  },
};
