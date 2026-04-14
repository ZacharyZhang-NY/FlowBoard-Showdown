import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createId } from "@paralleldrive/cuid2";
import { eq, count } from "drizzle-orm";
import * as schema from "./schema";
import path from "path";
import fs from "fs";
import { scryptSync, randomBytes } from "node:crypto";

const dbDir = path.join(process.cwd(), "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "flowboard.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  // Match BetterAuth's exact scrypt parameters: N=16384, r=16, p=1, dkLen=64
  const hash = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  }).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Checking if seed is needed...");

  const userCount = db.select({ value: count() }).from(schema.user).get();
  if (userCount && userCount.value > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  console.log("Seeding database...");

  const now = new Date();
  const userId = createId();

  // ─── Create test user ───────────────────────────────────────────────
  db.insert(schema.user).values({
    id: userId,
    name: "Zachary Zhang",
    email: "test@zacharyzhang.com",
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  }).run();

  // Create account with password for email/password auth
  const hashedPassword = hashPassword("Test@TestModels");
  db.insert(schema.account).values({
    id: createId(),
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  }).run();

  console.log("  Created test user: test@zacharyzhang.com");

  // ─── Create project ─────────────────────────────────────────────────
  const projectId = createId();
  db.insert(schema.projects).values({
    id: projectId,
    name: "FlowBoard Demo",
    key: "FB",
    description: "A demo project for FlowBoard project management",
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }).run();

  console.log("  Created project: FlowBoard Demo (FB)");

  // ─── Create board ───────────────────────────────────────────────────
  const boardId = createId();
  db.insert(schema.boards).values({
    id: boardId,
    projectId: projectId,
    name: "Main Board",
    position: 0,
    createdAt: now,
  }).run();

  // ─── Create columns ────────────────────────────────────────────────
  const columnConfigs = [
    { name: "To Do", color: "gray", position: 0 },
    { name: "In Progress", color: "blue", position: 1 },
    { name: "In Review", color: "purple", position: 2 },
    { name: "Done", color: "green", position: 3 },
  ];

  const columnIds: string[] = [];
  for (const col of columnConfigs) {
    const colId = createId();
    columnIds.push(colId);
    db.insert(schema.columns).values({
      id: colId,
      boardId: boardId,
      name: col.name,
      position: col.position,
      color: col.color,
    }).run();
  }

  console.log("  Created board with 4 columns");

  // ─── Create sprint ─────────────────────────────────────────────────
  const sprintId = createId();
  const sprintStart = new Date(now);
  sprintStart.setDate(sprintStart.getDate() - 3);
  const sprintEnd = new Date(now);
  sprintEnd.setDate(sprintEnd.getDate() + 11);

  db.insert(schema.sprints).values({
    id: sprintId,
    projectId: projectId,
    name: "Sprint 1",
    goal: "Set up core project management features",
    startDate: sprintStart,
    endDate: sprintEnd,
    status: "active",
    createdAt: now,
  }).run();

  console.log("  Created sprint: Sprint 1 (active)");

  // ─── Create labels ─────────────────────────────────────────────────
  const labelConfigs = [
    { name: "frontend", color: "blue" },
    { name: "backend", color: "green" },
    { name: "bug", color: "red" },
    { name: "design", color: "purple" },
    { name: "infra", color: "gray" },
  ];

  const labelIds: string[] = [];
  for (const label of labelConfigs) {
    const labelId = createId();
    labelIds.push(labelId);
    db.insert(schema.labels).values({
      id: labelId,
      projectId: projectId,
      name: label.name,
      color: label.color,
    }).run();
  }

  console.log("  Created 5 labels");

  // ─── Create issues ─────────────────────────────────────────────────
  const issueConfigs = [
    // To Do column (columnIds[0])
    { title: "Set up CI/CD pipeline", status: "todo", priority: "high", type: "task", column: 0, position: 0, points: 5, labels: [4], description: "Configure GitHub Actions for automated testing and deployment" },
    { title: "Add email notification system", status: "todo", priority: "medium", type: "feature", column: 0, position: 1, points: 8, labels: [1], description: "Implement email notifications for issue assignments and status changes" },
    { title: "Write API documentation", status: "todo", priority: "low", type: "task", column: 0, position: 2, points: 3, labels: [1], description: "Document all REST API endpoints with request/response examples" },
    // In Progress column (columnIds[1])
    { title: "Implement drag-and-drop board", status: "in_progress", priority: "critical", type: "feature", column: 1, position: 0, points: 13, labels: [0], assigned: true, description: "Build the Kanban board with drag-and-drop issue cards using dnd-kit" },
    { title: "Design sprint planning view", status: "in_progress", priority: "high", type: "task", column: 1, position: 1, points: 8, labels: [0, 3], assigned: true, description: "Create the sprint planning interface with backlog and sprint issue management" },
    // In Review column (columnIds[2])
    { title: "Fix sidebar navigation highlight", status: "in_review", priority: "medium", type: "bug", column: 2, position: 0, points: 2, labels: [0, 2], assigned: true, description: "Active page is not highlighted correctly in the side navigation" },
    { title: "Add issue filtering", status: "in_review", priority: "high", type: "feature", column: 2, position: 1, points: 5, labels: [0], assigned: true, description: "Implement filtering by status, priority, type, and assignee on the issues list" },
    // Done column (columnIds[3])
    { title: "Set up project structure", status: "done", priority: "critical", type: "task", column: 3, position: 0, points: 5, labels: [4], assigned: true, description: "Initialize Next.js project with TypeScript, Carbon, and Drizzle" },
    { title: "Create database schema", status: "done", priority: "critical", type: "task", column: 3, position: 1, points: 8, labels: [1], assigned: true, description: "Design and implement the SQLite database schema with Drizzle ORM" },
    { title: "Implement authentication", status: "done", priority: "critical", type: "feature", column: 3, position: 2, points: 5, labels: [1], assigned: true, description: "Set up BetterAuth with email/password login" },
    { title: "Build dashboard layout", status: "done", priority: "high", type: "task", column: 3, position: 3, points: 5, labels: [0, 3], assigned: true, description: "Create the main dashboard with stat cards and activity feed" },
    { title: "Fix date picker timezone issue", status: "done", priority: "medium", type: "bug", column: 3, position: 4, points: 2, labels: [0, 2], assigned: true, description: "Date picker was showing wrong dates due to timezone conversion" },
  ];

  const dueDateBase = new Date(now);
  dueDateBase.setDate(dueDateBase.getDate() + 7);

  for (let i = 0; i < issueConfigs.length; i++) {
    const config = issueConfigs[i];
    const issueId = createId();
    const dueDate = new Date(dueDateBase);
    dueDate.setDate(dueDate.getDate() + (i % 5) - 2);

    db.insert(schema.issues).values({
      id: issueId,
      projectId: projectId,
      columnId: columnIds[config.column],
      sprintId: sprintId,
      number: i + 1,
      title: config.title,
      description: config.description,
      status: config.status,
      priority: config.priority,
      type: config.type,
      assigneeId: config.assigned ? userId : null,
      reporterId: userId,
      position: config.position,
      storyPoints: config.points,
      dueDate: dueDate,
      createdAt: now,
      updatedAt: now,
    }).run();

    // Add labels
    for (const labelIdx of config.labels) {
      db.insert(schema.issueLabels).values({
        issueId: issueId,
        labelId: labelIds[labelIdx],
      }).run();
    }

    // Add activity log entry for creation
    db.insert(schema.activityLog).values({
      id: createId(),
      issueId: issueId,
      userId: userId,
      action: "created",
      newValue: config.title,
      createdAt: new Date(now.getTime() - (issueConfigs.length - i) * 3600000),
    }).run();
  }

  console.log("  Created 12 issues with labels and activity");

  // ─── Add some comments ─────────────────────────────────────────────
  const allIssues = db.select().from(schema.issues).all();
  const commentTexts = [
    "This looks good, moving forward with the implementation.",
    "Updated the approach based on team feedback.",
    "Blocked by the database migration — need to resolve first.",
    "Tested locally, all edge cases pass.",
  ];

  for (let i = 0; i < Math.min(4, allIssues.length); i++) {
    const commentId = createId();
    db.insert(schema.comments).values({
      id: commentId,
      issueId: allIssues[i].id,
      authorId: userId,
      content: commentTexts[i],
      createdAt: new Date(now.getTime() - (4 - i) * 1800000),
      updatedAt: new Date(now.getTime() - (4 - i) * 1800000),
    }).run();

    db.insert(schema.activityLog).values({
      id: createId(),
      issueId: allIssues[i].id,
      userId: userId,
      action: "commented",
      newValue: commentTexts[i].slice(0, 50),
      createdAt: new Date(now.getTime() - (4 - i) * 1800000),
    }).run();
  }

  console.log("  Created 4 comments with activity logs");
  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
