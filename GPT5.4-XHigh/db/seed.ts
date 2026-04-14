import { and, eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";

import {
  account,
  activityLogs,
  boards,
  columns,
  comments,
  issues,
  issueLabels,
  issueStateHistory,
  labels,
  projectCounters,
  projectMembers,
  projects,
  sprints,
  user,
} from "@/db/schema";
import { db } from "@/db/index";
import { boardPositionStep } from "@/src/shared/types/domain";
import { requireEnv } from "@/src/shared/utils/env";

const seedAdminEmail = requireEnv("SEED_ADMIN_EMAIL");
const seedAdminName = requireEnv("SEED_ADMIN_NAME");
const seedAdminPassword = requireEnv("SEED_ADMIN_PASSWORD");

type DemoIssueSeed = {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "critical" | "high" | "medium" | "low";
  type: "task" | "bug" | "feature" | "improvement";
  columnName: "To Do" | "In Progress" | "In Review" | "Done";
  storyPoints: number;
  labelNames: string[];
};

const demoIssues: DemoIssueSeed[] = [
  {
    title: "Set up authenticated application shell",
    description: "Create the Carbon shell, nav, and session-aware routing.",
    status: "todo",
    priority: "high",
    type: "feature",
    columnName: "To Do",
    storyPoints: 5,
    labelNames: ["frontend"],
  },
  {
    title: "Implement issue board API contract",
    description: "Define move, reorder, and filter endpoints for board operations.",
    status: "todo",
    priority: "critical",
    type: "feature",
    columnName: "To Do",
    storyPoints: 8,
    labelNames: ["backend", "infra"],
  },
  {
    title: "Create project membership model",
    description: "Enforce project-scoped assignee and permission rules.",
    status: "todo",
    priority: "high",
    type: "improvement",
    columnName: "To Do",
    storyPoints: 5,
    labelNames: ["backend"],
  },
  {
    title: "Dashboard cards and summary charts",
    description: "Build dashboard view with stat tiles, activity feed, and charts.",
    status: "in_progress",
    priority: "medium",
    type: "feature",
    columnName: "In Progress",
    storyPoints: 8,
    labelNames: ["frontend", "design"],
  },
  {
    title: "Add issue auto-save on detail view",
    description: "Persist field edits with version checks and toast feedback.",
    status: "in_progress",
    priority: "high",
    type: "feature",
    columnName: "In Progress",
    storyPoints: 5,
    labelNames: ["frontend", "backend"],
  },
  {
    title: "Harden login rate limits",
    description: "Protect credential endpoints with local in-memory throttling.",
    status: "in_review",
    priority: "high",
    type: "bug",
    columnName: "In Review",
    storyPoints: 3,
    labelNames: ["infra", "backend"],
  },
  {
    title: "Wire Swagger UI into App Router",
    description: "Expose a public docs page backed by generated OpenAPI JSON.",
    status: "done",
    priority: "medium",
    type: "improvement",
    columnName: "Done",
    storyPoints: 3,
    labelNames: ["backend"],
  },
  {
    title: "Design report tile layout",
    description: "Define Carbon tile layout for burndown, velocity, and flow charts.",
    status: "done",
    priority: "low",
    type: "task",
    columnName: "Done",
    storyPoints: 2,
    labelNames: ["design"],
  },
  {
    title: "Add sprint planning drag interactions",
    description: "Allow backlog issues to move into a planned sprint lane.",
    status: "done",
    priority: "medium",
    type: "feature",
    columnName: "Done",
    storyPoints: 5,
    labelNames: ["frontend"],
  },
  {
    title: "Seed project demo data",
    description: "Populate the first-run database with a full FlowBoard sample.",
    status: "done",
    priority: "low",
    type: "task",
    columnName: "Done",
    storyPoints: 2,
    labelNames: ["infra"],
  },
  {
    title: "Column WIP warnings",
    description: "Surface warnings when column counts cross WIP thresholds.",
    status: "todo",
    priority: "medium",
    type: "improvement",
    columnName: "To Do",
    storyPoints: 3,
    labelNames: ["frontend"],
  },
  {
    title: "Persist board reorder positions",
    description: "Guarantee reorder stability after browser refreshes.",
    status: "in_progress",
    priority: "critical",
    type: "bug",
    columnName: "In Progress",
    storyPoints: 5,
    labelNames: ["backend", "bug"],
  },
];

async function ensureAdminUser(): Promise<string> {
  const existingUsers = await db.select().from(user).limit(1);
  const existingUser = existingUsers.at(0);
  if (existingUser) {
    return existingUser.id;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(seedAdminPassword);
  const createdAt = new Date();

  await db.insert(user).values({
    id: userId,
    email: seedAdminEmail,
    name: seedAdminName,
    emailVerified: true,
    role: "admin",
    image: null,
    createdAt,
    updatedAt: createdAt,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId,
    accountId: seedAdminEmail,
    providerId: "credential",
    password: passwordHash,
    createdAt,
    updatedAt: createdAt,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  });

  return userId;
}

async function seedDemoData(adminUserId: string): Promise<void> {
  const existingProjects = await db.select().from(projects).limit(1);
  if (existingProjects.length > 0) {
    return;
  }

  const projectId = crypto.randomUUID();
  const boardId = crypto.randomUUID();
  const sprintId = crypto.randomUUID();
  const createdAt = new Date();
  const sprintEndDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);

  const columnSeeds = [
    { id: crypto.randomUUID(), name: "To Do", color: "gray" },
    { id: crypto.randomUUID(), name: "In Progress", color: "blue" },
    { id: crypto.randomUUID(), name: "In Review", color: "purple" },
    { id: crypto.randomUUID(), name: "Done", color: "green" },
  ] as const;

  const labelSeeds = [
    { id: crypto.randomUUID(), name: "frontend", color: "blue" },
    { id: crypto.randomUUID(), name: "backend", color: "purple" },
    { id: crypto.randomUUID(), name: "bug", color: "red" },
    { id: crypto.randomUUID(), name: "design", color: "teal" },
    { id: crypto.randomUUID(), name: "infra", color: "warm-gray" },
  ] as const;

  await db.transaction((tx) => {
    tx.insert(projects).values({
      id: projectId,
      name: "FlowBoard Demo",
      key: "FB",
      description: "Seeded demo project for local FlowBoard development.",
      createdBy: adminUserId,
      createdAt,
      updatedAt: createdAt,
    });

    tx.insert(projectMembers).values({
      projectId,
      userId: adminUserId,
      role: "admin",
      createdAt,
    });

    tx.insert(projectCounters).values({
      projectId,
      nextIssueNumber: demoIssues.length + 1,
      updatedAt: createdAt,
    });

    tx.insert(boards).values({
      id: boardId,
      projectId,
      name: "Main Board",
      position: boardPositionStep,
      createdAt,
      updatedAt: createdAt,
    });

    tx.insert(columns).values(
      columnSeeds.map((columnSeed, index) => ({
        id: columnSeed.id,
        boardId,
        name: columnSeed.name,
        color: columnSeed.color,
        position: (index + 1) * boardPositionStep,
        createdAt,
        updatedAt: createdAt,
        wipLimit: columnSeed.name === "In Progress" ? 4 : null,
      })),
    );

    tx.insert(sprints).values({
      id: sprintId,
      projectId,
      name: "Sprint 1",
      goal: "Ship the first complete FlowBoard experience.",
      status: "active",
      startDate: createdAt,
      endDate: sprintEndDate,
      createdAt,
      updatedAt: createdAt,
    });

    tx.insert(labels).values(
      labelSeeds.map((labelSeed) => ({
        id: labelSeed.id,
        projectId,
        name: labelSeed.name,
        color: labelSeed.color,
        createdAt,
        updatedAt: createdAt,
      })),
    );

    for (const [index, issueSeed] of demoIssues.entries()) {
      const issueId = crypto.randomUUID();
      const issueNumber = index + 1;
      const column = columnSeeds.find(
        (columnSeed) => columnSeed.name === issueSeed.columnName,
      );
      if (!column) {
        throw new Error(`Missing column for seed issue: ${issueSeed.title}`);
      }

      const dueDate = new Date(
        createdAt.getTime() + (index + 1) * 24 * 60 * 60 * 1000,
      );

      tx.insert(issues).values({
        id: issueId,
        projectId,
        boardId,
        columnId: column.id,
        sprintId: issueSeed.status === "todo" ? null : sprintId,
        number: issueNumber,
        title: issueSeed.title,
        description: issueSeed.description,
        status: issueSeed.status,
        priority: issueSeed.priority,
        type: issueSeed.type,
        assigneeId:
          issueSeed.status === "todo" && index % 2 === 0 ? null : adminUserId,
        reporterId: adminUserId,
        position: (index + 1) * boardPositionStep,
        storyPoints: issueSeed.storyPoints,
        dueDate,
        version: 1,
        createdAt,
        updatedAt: createdAt,
      });

      for (const labelName of issueSeed.labelNames) {
        const label = labelSeeds.find((labelSeed) => labelSeed.name === labelName);
        if (!label) {
          throw new Error(`Missing label for seed issue: ${issueSeed.title}`);
        }

        tx.insert(issueLabels).values({
          issueId,
          labelId: label.id,
        });
      }

      tx.insert(activityLogs).values({
        id: crypto.randomUUID(),
        requestId: `seed-${issueNumber}`,
        projectId,
        issueId,
        actorId: adminUserId,
        action: "issue_created",
        oldValue: null,
        newValue: JSON.stringify({ status: issueSeed.status }),
        createdAt: createdAt,
      });

      tx.insert(issueStateHistory).values({
        id: crypto.randomUUID(),
        issueId,
        projectId,
        sprintId: issueSeed.status === "todo" ? null : sprintId,
        status: issueSeed.status,
        storyPoints: issueSeed.storyPoints,
        recordedAt: createdAt,
      });

      if (index < 3) {
        tx.insert(comments).values({
          id: crypto.randomUUID(),
          issueId,
          authorId: adminUserId,
          content: `Seeded note for ${issueSeed.title}.`,
          createdAt,
          updatedAt: createdAt,
        });

        tx.insert(activityLogs).values({
          id: crypto.randomUUID(),
          requestId: `seed-comment-${issueNumber}`,
          projectId,
          issueId,
          actorId: adminUserId,
          action: "issue_commented",
          oldValue: null,
          newValue: JSON.stringify({ content: "Seeded note" }),
          createdAt,
        });
      }
    }
  });
}

async function main(): Promise<void> {
  const adminUserId = await ensureAdminUser();
  await seedDemoData(adminUserId);
}

void main();
