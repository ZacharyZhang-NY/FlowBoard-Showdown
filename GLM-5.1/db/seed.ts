import { db } from "./index";
import { eq } from "drizzle-orm";
import {
  user,
  projects,
  boards,
  columns,
  issues,
  sprints,
  labels,
} from "./schema";
import { auth } from "../lib/auth";

async function seed() {
  const existing = db.select({ id: user.id }).from(user).limit(1).all();
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  console.log("Seeding database...");

  const signUpResult = await auth.api.signUpEmail({
    body: {
      email: "test@zacharyzhang.com",
      password: "Test@TestModels",
      name: "Zachary Zhang",
    },
  });

  const userId = signUpResult.user.id;
  db.update(user).set({ role: "admin" }).where(eq(user.id, userId)).run();

  const [project] = db
    .insert(projects)
    .values({
      name: "FlowBoard Demo",
      key: "FB",
      description: "A demo project for FlowBoard",
      createdBy: userId,
    })
    .returning()
    .all();

  const [board] = db
    .insert(boards)
    .values({ projectId: project.id, name: "Main Board", position: 0 })
    .returning()
    .all();

  const columnDefs = [
    { name: "To Do", position: 0, color: "gray" },
    { name: "In Progress", position: 1, color: "blue" },
    { name: "In Review", position: 2, color: "purple" },
    { name: "Done", position: 3, color: "green" },
  ];

  const cols = db
    .insert(columns)
    .values(columnDefs.map((c) => ({ boardId: board.id, ...c })))
    .returning()
    .all();

  const now = new Date();
  const sprintEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [sprint] = db
    .insert(sprints)
    .values({
      projectId: project.id,
      name: "Sprint 1",
      goal: "Complete initial FlowBoard setup",
      startDate: now,
      endDate: sprintEnd,
      status: "active",
    })
    .returning()
    .all();

  const statusToColumn: Record<string, string> = {
    todo: cols[0].id,
    in_progress: cols[1].id,
    in_review: cols[2].id,
    done: cols[3].id,
  };

  const issueData: Array<{
    title: string;
    desc: string;
    priority: "critical" | "high" | "medium" | "low";
    type: "task" | "bug" | "feature" | "improvement";
    status: "todo" | "in_progress" | "in_review" | "done" | "blocked";
    sp: number;
    assigned?: boolean;
  }> = [
    { title: "Set up CI/CD pipeline", desc: "Configure GitHub Actions for automated builds", priority: "medium", type: "task", status: "todo", sp: 5 },
    { title: "Design notification system", desc: "Create wireframes for notification center", priority: "high", type: "feature", status: "todo", sp: 3 },
    { title: "Fix sidebar collapse animation", desc: "Sidebar stutters on mobile devices", priority: "medium", type: "bug", status: "todo", sp: 2 },
    { title: "Implement user dashboard", desc: "Build main dashboard with widgets and charts", priority: "critical", type: "feature", status: "in_progress", sp: 8, assigned: true },
    { title: "Add drag-and-drop to board", desc: "Integrate dnd-kit for Kanban card movement", priority: "high", type: "feature", status: "in_progress", sp: 5, assigned: true },
    { title: "Update API documentation", desc: "Document all endpoints with Swagger", priority: "low", type: "improvement", status: "in_review", sp: 3 },
    { title: "Set up project structure", desc: "Initialize Next.js with TypeScript and Carbon", priority: "medium", type: "task", status: "done", sp: 2, assigned: true },
    { title: "Configure database schema", desc: "Define Drizzle ORM schema for all tables", priority: "high", type: "task", status: "done", sp: 3 },
    { title: "Implement authentication", desc: "Set up BetterAuth with email/password", priority: "critical", type: "feature", status: "done", sp: 5, assigned: true },
    { title: "Create Carbon theme setup", desc: "Configure IBM Carbon with g10/g90 themes", priority: "medium", type: "task", status: "done", sp: 2 },
    { title: "Build board API endpoints", desc: "Create REST API for boards and issues", priority: "high", type: "feature", status: "done", sp: 8 },
    { title: "Fix login redirect issue", desc: "Users not redirected after login", priority: "medium", type: "bug", status: "done", sp: 1 },
  ];

  let position = 0;
  for (const item of issueData) {
    position++;
    db
      .insert(issues)
      .values({
        projectId: project.id,
        columnId: statusToColumn[item.status] ?? null,
        sprintId: sprint.id,
        number: position,
        title: item.title,
        description: item.desc,
        status: item.status,
        priority: item.priority,
        type: item.type,
        assigneeId: item.assigned ? userId : null,
        reporterId: userId,
        position,
        storyPoints: item.sp,
      })
      .run();
  }

  db.insert(labels).values([
    { projectId: project.id, name: "frontend", color: "blue" },
    { projectId: project.id, name: "backend", color: "green" },
    { projectId: project.id, name: "bug", color: "red" },
    { projectId: project.id, name: "design", color: "purple" },
    { projectId: project.id, name: "infra", color: "gray" },
  ]).run();

  console.log("Seed complete. Created project, board, 12 issues, and labels.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
