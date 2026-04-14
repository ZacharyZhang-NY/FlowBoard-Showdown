import {
  completeSprintSchema,
  createSprintSchema,
  sprintDetailSchema,
  sprintSummarySchema,
  startSprintSchema,
  updateSprintSchema,
} from "@/src/modules/sprints/contract/sprint.schemas";
import { sprintsRepository } from "@/src/modules/sprints/infra/sprints.repository";
import { mapTag, mapUserSummary } from "@/src/shared/api/mappers";
import { conflict, ensure, notFound } from "@/src/shared/api/errors";
import { parseWithSchema } from "@/src/shared/api/validation";
import { requireProjectAdmin, requireProjectMember } from "@/src/shared/auth/authorization";
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

function mapSprintDetail(sprint: Awaited<ReturnType<typeof sprintsRepository.findById>> extends infer TSprint
  ? NonNullable<TSprint>
  : never) {
  const mappedIssues = sprint.issues.map((issue) => mapIssueSummary(issue));
  const issuesByStatus = {
    todo: mappedIssues.filter((issue) => issue.status === "todo"),
    in_progress: mappedIssues.filter((issue) => issue.status === "in_progress"),
    in_review: mappedIssues.filter((issue) => issue.status === "in_review"),
    done: mappedIssues.filter((issue) => issue.status === "done"),
    blocked: mappedIssues.filter((issue) => issue.status === "blocked"),
  };

  return sprintDetailSchema.parse({
    id: sprint.id,
    projectId: sprint.projectId,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    startDate: sprint.startDate ? toIsoStringRequired(sprint.startDate) : null,
    endDate: sprint.endDate ? toIsoStringRequired(sprint.endDate) : null,
    createdAt: toIsoStringRequired(sprint.createdAt),
    updatedAt: toIsoStringRequired(sprint.updatedAt),
    totalStoryPoints: mappedIssues.reduce((total, issue) => total + (issue.storyPoints ?? 0), 0),
    completedStoryPoints: mappedIssues
      .filter((issue) => issue.status === "done")
      .reduce((total, issue) => total + (issue.storyPoints ?? 0), 0),
    issuesByStatus,
  });
}

export const sprintsService = {
  async listSprints(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const sprints = await sprintsRepository.listByProject(projectId);
    return sprints.map((sprint) => mapSprintDetail(sprint));
  },

  async getSprint(userId: string, sprintId: string) {
    const sprint = await sprintsRepository.findById(sprintId);
    ensure(sprint, notFound("Sprint not found"));
    await requireProjectMember(userId, sprint.projectId);
    return mapSprintDetail(sprint);
  },

  async createSprint(userId: string, projectId: string, payload: unknown) {
    await requireProjectAdmin(userId, projectId);
    const values = parseWithSchema(createSprintSchema, payload);
    const [sprint] = await sprintsRepository.create(projectId, values);
    ensure(sprint, notFound("Sprint not created"));
    return this.getSprint(userId, sprint.id);
  },

  async updateSprint(userId: string, sprintId: string, payload: unknown) {
    const current = await sprintsRepository.findById(sprintId);
    ensure(current, notFound("Sprint not found"));
    await requireProjectAdmin(userId, current.projectId);

    const values = parseWithSchema(updateSprintSchema, payload);
    await sprintsRepository.update(sprintId, {
      name: values.name ?? current.name,
      goal: values.goal !== undefined ? values.goal : current.goal,
    });

    return this.getSprint(userId, sprintId);
  },

  async startSprint(userId: string, sprintId: string, payload: unknown, requestId: string) {
    const sprint = await sprintsRepository.findById(sprintId);
    ensure(sprint, notFound("Sprint not found"));
    await requireProjectAdmin(userId, sprint.projectId);

    const values = parseWithSchema(startSprintSchema, payload);
    const existingActive = await sprintsRepository.findActiveSprint(sprint.projectId, sprintId);
    ensure(!existingActive, conflict("Project already has an active sprint"));

    await sprintsRepository.startSprint({
      sprintId,
      actorId: userId,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      requestId,
    });

    return this.getSprint(userId, sprintId);
  },

  async completeSprint(userId: string, sprintId: string, payload: unknown, requestId: string) {
    const sprint = await sprintsRepository.findById(sprintId);
    ensure(sprint, notFound("Sprint not found"));
    await requireProjectAdmin(userId, sprint.projectId);

    const values = parseWithSchema(completeSprintSchema, payload);
    const completed = await sprintsRepository.completeSprint({
      sprintId,
      actorId: userId,
      moveIncompleteIssuesToBacklog: values.moveIncompleteIssuesToBacklog,
      requestId,
    });

    ensure(completed, notFound("Sprint not found"));
    return this.getSprint(userId, sprintId);
  },
};
