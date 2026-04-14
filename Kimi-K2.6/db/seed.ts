import { eq } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { addDays, startOfDay } from "date-fns";

async function seed() {
  const existingUsers = await db.select().from(schema.user).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  const seedAuth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      signUpEnabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
  });

  const signUpRes = await seedAuth.api.signUpEmail({
    body: {
      email: "test@zacharyzhang.com",
      password: "Test@TestModels",
      name: "Zachary Zhang",
    },
  });

  const userId = signUpRes.user?.id;
  if (!userId) {
    throw new Error("Failed to create seed user");
  }

  const [project] = await db
    .insert(schema.projects)
    .values({
      name: "FlowBoard Demo",
      key: "FB",
      description: "Demo project for FlowBoard",
      createdBy: userId,
    })
    .returning();

  const [board] = await db
    .insert(schema.boards)
    .values({
      projectId: project.id,
      name: "Main Board",
      position: 0,
    })
    .returning();

  const columnsData = [
    { name: "To Do", color: "gray", position: 0 },
    { name: "In Progress", color: "blue", position: 1 },
    { name: "In Review", color: "purple", position: 2 },
    { name: "Done", color: "green", position: 3 },
  ];

  const cols = await db
    .insert(schema.columns)
    .values(columnsData.map((c) => ({ ...c, boardId: board.id })))
    .returning();

  const today = startOfDay(new Date());
  const [sprint] = await db
    .insert(schema.sprints)
    .values({
      projectId: project.id,
      name: "Sprint 1",
      goal: "Initial sprint for demo",
      startDate: today,
      endDate: addDays(today, 14),
      status: "active",
    })
    .returning();

  const labelsData = [
    { name: "frontend", color: "blue" },
    { name: "backend", color: "green" },
    { name: "bug", color: "red" },
    { name: "design", color: "purple" },
    { name: "infra", color: "gray" },
  ];

  const createdLabels = await db
    .insert(schema.labels)
    .values(labelsData.map((l) => ({ ...l, projectId: project.id })))
    .returning();

  const issuesSeed = [
    { title: "Set up project repository", status: "done", priority: "high", type: "task", columnIdx: 3, points: 3 },
    { title: "Design database schema", status: "done", priority: "high", type: "task", columnIdx: 3, points: 5 },
    { title: "Implement authentication", status: "in_progress", priority: "critical", type: "feature", columnIdx: 1, points: 8 },
    { title: "Create Kanban board UI", status: "in_progress", priority: "high", type: "feature", columnIdx: 1, points: 8 },
    { title: "Build issue detail page", status: "todo", priority: "medium", type: "feature", columnIdx: 0, points: 5 },
    { title: "Add drag and drop support", status: "in_review", priority: "high", type: "feature", columnIdx: 2, points: 5 },
    { title: "Fix login redirect bug", status: "done", priority: "medium", type: "bug", columnIdx: 3, points: 2 },
    { title: "Integrate Carbon Design System", status: "done", priority: "high", type: "task", columnIdx: 3, points: 5 },
    { title: "Write API documentation", status: "todo", priority: "low", type: "task", columnIdx: 0, points: 3 },
    { title: "Set up CI/CD pipeline", status: "todo", priority: "medium", type: "task", columnIdx: 0, points: 5 },
    { title: "Performance optimization", status: "blocked", priority: "high", type: "improvement", columnIdx: 0, points: 5 },
    { title: "User feedback survey", status: "todo", priority: "low", type: "task", columnIdx: 0, points: 2 },
  ];

  for (let i = 0; i < issuesSeed.length; i++) {
    const is = issuesSeed[i];
    const columnId = cols[is.columnIdx].id;
    const assigneeId = i % 3 === 0 ? userId : null;

    const [issue] = await db
      .insert(schema.issues)
      .values({
        projectId: project.id,
        columnId,
        sprintId: sprint.id,
        number: i + 1,
        title: is.title,
        status: is.status,
        priority: is.priority,
        type: is.type,
        assigneeId,
        reporterId: userId,
        position: i,
        storyPoints: is.points,
        dueDate: addDays(today, i < 4 ? -1 : i + 3),
      })
      .returning();

    if (i % 2 === 0 && createdLabels.length > 0) {
      await db.insert(schema.issueLabels).values({
        issueId: issue.id,
        labelId: createdLabels[i % createdLabels.length].id,
      });
    }

    await db.insert(schema.activityLog).values({
      issueId: issue.id,
      userId,
      action: "created",
      newValue: is.title,
    });
  }

  console.log("Seeding completed successfully.");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
