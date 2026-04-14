"use client";

import { Tag } from "@carbon/react";

import type { IssuePriority, IssueStatus } from "@/src/shared/types/domain";

const statusKinds: Record<IssueStatus, "gray" | "blue" | "green" | "purple" | "red"> = {
  todo: "gray",
  in_progress: "blue",
  in_review: "purple",
  done: "green",
  blocked: "red",
};

const priorityKinds: Record<IssuePriority, "gray" | "blue" | "warm-gray" | "red"> = {
  critical: "red",
  high: "warm-gray",
  medium: "blue",
  low: "gray",
};

const statusLabels: Record<IssueStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

const priorityLabels: Record<IssuePriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function StatusTag({ status }: { status: IssueStatus }) {
  return <Tag type={statusKinds[status]}>{statusLabels[status]}</Tag>;
}

export function PriorityTag({ priority }: { priority: IssuePriority }) {
  return <Tag type={priorityKinds[priority]}>{priorityLabels[priority]}</Tag>;
}
