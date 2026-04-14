import type { InferSelectModel } from "drizzle-orm";
import * as schema from "@/db/schema";

export type User = InferSelectModel<typeof schema.user>;
export type Session = InferSelectModel<typeof schema.session>;
export type Project = InferSelectModel<typeof schema.projects>;
export type Board = InferSelectModel<typeof schema.boards>;
export type Column = InferSelectModel<typeof schema.columns>;
export type Issue = InferSelectModel<typeof schema.issues>;
export type Sprint = InferSelectModel<typeof schema.sprints>;
export type Comment = InferSelectModel<typeof schema.comments>;
export type Label = InferSelectModel<typeof schema.labels>;
export type IssueLabel = InferSelectModel<typeof schema.issueLabels>;
export type ActivityLogEntry = InferSelectModel<typeof schema.activityLog>;

export const ISSUE_STATUSES = ["todo", "in_progress", "in_review", "done", "blocked"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_TYPES = ["task", "bug", "feature", "improvement"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const SPRINT_STATUSES = ["planning", "active", "completed"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type BoardWithDetails = Board & {
  columns: (Column & { issues: IssueWithLabels[] })[];
};

export type IssueWithLabels = Issue & {
  labels: Label[];
};

export type IssueDetail = IssueWithLabels & {
  comments: (Comment & { author: Pick<User, "id" | "name" | "email" | "image"> })[];
  activity: (ActivityLogEntry & { user: Pick<User, "id" | "name"> })[];
};

export type SprintWithIssues = Sprint & {
  issues: IssueWithLabels[];
};

export type ProjectWithCounts = Project & {
  issueCount: number;
  openIssueCount: number;
};
