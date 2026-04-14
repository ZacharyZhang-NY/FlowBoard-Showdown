export const issueStatusValues = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
] as const;

export const issuePriorityValues = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export const issueTypeValues = [
  "task",
  "bug",
  "feature",
  "improvement",
] as const;

export const sprintStatusValues = [
  "planning",
  "active",
  "completed",
] as const;

export const memberRoleValues = [
  "admin",
  "member",
] as const;

export const themeModeValues = [
  "g10",
  "g90",
] as const;

export const activityActionValues = [
  "issue_created",
  "issue_updated",
  "issue_moved",
  "issue_reordered",
  "issue_assigned",
  "issue_commented",
  "sprint_created",
  "sprint_started",
  "sprint_completed",
  "board_updated",
  "label_updated",
] as const;

export type IssueStatus = (typeof issueStatusValues)[number];
export type IssuePriority = (typeof issuePriorityValues)[number];
export type IssueType = (typeof issueTypeValues)[number];
export type SprintStatus = (typeof sprintStatusValues)[number];
export type MemberRole = (typeof memberRoleValues)[number];
export type ThemeMode = (typeof themeModeValues)[number];
export type ActivityAction = (typeof activityActionValues)[number];

export const boardPositionStep = 1_000;
