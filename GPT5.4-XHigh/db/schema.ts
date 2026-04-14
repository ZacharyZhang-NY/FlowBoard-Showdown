import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import {
  activityActionValues,
  issuePriorityValues,
  issueStatusValues,
  issueTypeValues,
  memberRoleValues,
  sprintStatusValues,
} from "@/src/shared/types/domain";

const now = () => new Date();

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  role: text("role").notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    userIndex: index("session_user_id_idx").on(table.userId),
  }),
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    providerAccountIndex: uniqueIndex("account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
    userIndex: index("account_user_id_idx").on(table.userId),
  }),
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    lookupIndex: uniqueIndex("verification_identifier_value_idx").on(
      table.identifier,
      table.value,
    ),
  }),
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    keyIndex: uniqueIndex("projects_key_idx").on(table.key),
  }),
);

export const projectMembers = sqliteTable(
  "project_members",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: memberRoleValues }).notNull().default("member"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
    roleIndex: index("project_members_role_idx").on(table.projectId, table.role),
  }),
);

export const projectCounters = sqliteTable("project_counters", {
  projectId: text("project_id")
    .primaryKey()
    .references(() => projects.id, { onDelete: "cascade" }),
  nextIssueNumber: integer("next_issue_number").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now),
});

export const boards = sqliteTable(
  "boards",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(1_000),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    projectPositionIndex: uniqueIndex("boards_project_position_idx").on(
      table.projectId,
      table.position,
    ),
  }),
);

export const columns = sqliteTable(
  "columns",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("gray"),
    position: integer("position").notNull().default(1_000),
    wipLimit: integer("wip_limit"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    boardPositionIndex: uniqueIndex("columns_board_position_idx").on(
      table.boardId,
      table.position,
    ),
  }),
);

export const sprints = sqliteTable(
  "sprints",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    goal: text("goal"),
    status: text("status", { enum: sprintStatusValues })
      .notNull()
      .default("planning"),
    startDate: integer("start_date", { mode: "timestamp_ms" }),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    projectStatusIndex: index("sprints_project_status_idx").on(
      table.projectId,
      table.status,
    ),
  }),
);

export const issues = sqliteTable(
  "issues",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    columnId: text("column_id").references(() => columns.id, {
      onDelete: "set null",
    }),
    sprintId: text("sprint_id").references(() => sprints.id, {
      onDelete: "set null",
    }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: issueStatusValues })
      .notNull()
      .default("todo"),
    priority: text("priority", { enum: issuePriorityValues })
      .notNull()
      .default("medium"),
    type: text("type", { enum: issueTypeValues }).notNull().default("task"),
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id),
    position: integer("position").notNull().default(1_000),
    storyPoints: integer("story_points"),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    version: integer("version").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    projectNumberIndex: uniqueIndex("issues_project_number_idx").on(
      table.projectId,
      table.number,
    ),
    boardColumnPositionIndex: uniqueIndex("issues_board_column_position_idx").on(
      table.boardId,
      table.columnId,
      table.position,
    ),
    projectStatusUpdatedIndex: index("issues_project_status_updated_idx").on(
      table.projectId,
      table.status,
      table.updatedAt,
    ),
    sprintStatusIndex: index("issues_sprint_status_idx").on(
      table.sprintId,
      table.status,
    ),
    assigneeUpdatedIndex: index("issues_assignee_updated_idx").on(
      table.assigneeId,
      table.updatedAt,
    ),
    projectDueDateIndex: index("issues_project_due_date_idx").on(
      table.projectId,
      table.dueDate,
    ),
  }),
);

export const labels = sqliteTable(
  "labels",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("blue"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    projectNameIndex: uniqueIndex("labels_project_name_idx").on(
      table.projectId,
      table.name,
    ),
  }),
);

export const issueLabels = sqliteTable(
  "issue_labels",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.issueId, table.labelId] }),
  }),
);

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    issueCreatedIndex: index("comments_issue_created_idx").on(
      table.issueId,
      table.createdAt,
    ),
  }),
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    requestId: text("request_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    action: text("action", { enum: activityActionValues }).notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    issueCreatedIndex: index("activity_logs_issue_created_idx").on(
      table.issueId,
      table.createdAt,
    ),
    projectCreatedIndex: index("activity_logs_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
    requestIndex: index("activity_logs_request_idx").on(table.requestId),
  }),
);

export const issueStateHistory = sqliteTable(
  "issue_state_history",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sprintId: text("sprint_id").references(() => sprints.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: issueStatusValues }).notNull(),
    storyPoints: integer("story_points"),
    recordedAt: integer("recorded_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (table) => ({
    issueRecordedIndex: index("issue_state_history_issue_recorded_idx").on(
      table.issueId,
      table.recordedAt,
    ),
    projectRecordedIndex: index("issue_state_history_project_recorded_idx").on(
      table.projectId,
      table.recordedAt,
    ),
  }),
);

export const projectRelations = relations(projects, ({ many, one }) => ({
  creator: one(user, {
    fields: [projects.createdBy],
    references: [user.id],
  }),
  boards: many(boards),
  members: many(projectMembers),
  sprints: many(sprints),
  issues: many(issues),
  labels: many(labels),
}));

export const boardRelations = relations(boards, ({ many, one }) => ({
  project: one(projects, {
    fields: [boards.projectId],
    references: [projects.id],
  }),
  columns: many(columns),
  issues: many(issues),
}));

export const columnRelations = relations(columns, ({ many, one }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  issues: many(issues),
}));

export const sprintRelations = relations(sprints, ({ many, one }) => ({
  project: one(projects, {
    fields: [sprints.projectId],
    references: [projects.id],
  }),
  issues: many(issues),
}));

export const issueRelations = relations(issues, ({ many, one }) => ({
  project: one(projects, {
    fields: [issues.projectId],
    references: [projects.id],
  }),
  board: one(boards, {
    fields: [issues.boardId],
    references: [boards.id],
  }),
  column: one(columns, {
    fields: [issues.columnId],
    references: [columns.id],
  }),
  sprint: one(sprints, {
    fields: [issues.sprintId],
    references: [sprints.id],
  }),
  assignee: one(user, {
    fields: [issues.assigneeId],
    references: [user.id],
  }),
  reporter: one(user, {
    fields: [issues.reporterId],
    references: [user.id],
  }),
  comments: many(comments),
  labels: many(issueLabels),
  activityLogs: many(activityLogs),
  stateHistory: many(issueStateHistory),
}));

export const labelRelations = relations(labels, ({ many, one }) => ({
  project: one(projects, {
    fields: [labels.projectId],
    references: [projects.id],
  }),
  issues: many(issueLabels),
}));

export const issueLabelRelations = relations(issueLabels, ({ one }) => ({
  issue: one(issues, {
    fields: [issueLabels.issueId],
    references: [issues.id],
  }),
  label: one(labels, {
    fields: [issueLabels.labelId],
    references: [labels.id],
  }),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
  author: one(user, {
    fields: [comments.authorId],
    references: [user.id],
  }),
}));

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  member: one(user, {
    fields: [projectMembers.userId],
    references: [user.id],
  }),
}));

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  issue: one(issues, {
    fields: [activityLogs.issueId],
    references: [issues.id],
  }),
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  actor: one(user, {
    fields: [activityLogs.actorId],
    references: [user.id],
  }),
}));

export const issueStateHistoryRelations = relations(
  issueStateHistory,
  ({ one }) => ({
    issue: one(issues, {
      fields: [issueStateHistory.issueId],
      references: [issues.id],
    }),
    project: one(projects, {
      fields: [issueStateHistory.projectId],
      references: [projects.id],
    }),
    sprint: one(sprints, {
      fields: [issueStateHistory.sprintId],
      references: [sprints.id],
    }),
  }),
);

export type UserRecord = typeof user.$inferSelect;
export type SessionRecord = typeof session.$inferSelect;
export type ProjectRecord = typeof projects.$inferSelect;
export type IssueRecord = typeof issues.$inferSelect;
