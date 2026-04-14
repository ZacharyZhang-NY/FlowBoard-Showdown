import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  user,
  projects,
  boards,
  columns,
  issues,
  sprints,
  comments,
  labels,
  activityLog,
} from "@/db/schema";

// ─── Select types (read from DB) ────────────────────────────────────────────

export type User = InferSelectModel<typeof user>;
export type Project = InferSelectModel<typeof projects>;
export type Board = InferSelectModel<typeof boards>;
export type Column = InferSelectModel<typeof columns>;
export type Issue = InferSelectModel<typeof issues>;
export type Sprint = InferSelectModel<typeof sprints>;
export type Comment = InferSelectModel<typeof comments>;
export type Label = InferSelectModel<typeof labels>;
export type ActivityLogEntry = InferSelectModel<typeof activityLog>;

// ─── Insert types (write to DB) ─────────────────────────────────────────────

export type NewProject = InferInsertModel<typeof projects>;
export type NewBoard = InferInsertModel<typeof boards>;
export type NewColumn = InferInsertModel<typeof columns>;
export type NewIssue = InferInsertModel<typeof issues>;
export type NewSprint = InferInsertModel<typeof sprints>;
export type NewComment = InferInsertModel<typeof comments>;
export type NewLabel = InferInsertModel<typeof labels>;

// ─── API response types ─────────────────────────────────────────────────────

export type ApiResponse<T> = { data: T };
export type ApiError = { error: string };

// ─── Status / Priority / Type enums ─────────────────────────────────────────

export const ISSUE_STATUSES = ["todo", "in_progress", "in_review", "done", "blocked"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_TYPES = ["task", "bug", "feature", "improvement"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const SPRINT_STATUSES = ["planning", "active", "completed"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

// ─── Board view aggregate types ─────────────────────────────────────────────

export type BoardWithColumns = Board & {
  columns: ColumnWithIssues[];
};

export type ColumnWithIssues = Column & {
  issues: IssueWithRelations[];
};

export type IssueWithRelations = Issue & {
  assignee?: Pick<User, "id" | "name" | "email" | "image"> | null;
  reporter: Pick<User, "id" | "name" | "email" | "image">;
  labels: Label[];
};

export type IssueDetail = Issue & {
  assignee?: Pick<User, "id" | "name" | "email" | "image"> | null;
  reporter: Pick<User, "id" | "name" | "email" | "image">;
  labels: Label[];
  project: Pick<Project, "id" | "name" | "key">;
};

// ─── Report types ───────────────────────────────────────────────────────────

export type BurndownDataPoint = {
  date: string;
  ideal: number;
  actual: number;
};

export type VelocityDataPoint = {
  sprint: string;
  completed: number;
  committed: number;
};

export type DistributionDataPoint = {
  group: string;
  value: number;
};

// ─── Tag color mapping helpers ──────────────────────────────────────────────

export type CarbonTagType = "gray" | "blue" | "purple" | "green" | "red" | "warm-gray" | "magenta" | "cyan" | "teal" | "cool-gray" | "high-contrast" | "outline";

export const STATUS_TAG_KIND = {
  todo: "gray",
  in_progress: "blue",
  in_review: "purple",
  done: "green",
  blocked: "red",
} as const satisfies Record<IssueStatus, CarbonTagType>;

export const PRIORITY_TAG_KIND = {
  critical: "red",
  high: "warm-gray",
  medium: "blue",
  low: "gray",
} as const satisfies Record<IssuePriority, CarbonTagType>;

export const STATUS_LABELS: Record<IssueStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TYPE_LABELS: Record<IssueType, string> = {
  task: "Task",
  bug: "Bug",
  feature: "Feature",
  improvement: "Improvement",
};
