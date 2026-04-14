import { format } from "date-fns";

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "\u2014";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "\u2014";
  return format(date, "MMM d, yyyy HH:mm");
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, "MMM d, yyyy");
}

export function getStatusTagKind(status: string): string {
  const map: Record<string, string> = {
    todo: "gray",
    in_progress: "blue",
    in_review: "purple",
    done: "green",
    blocked: "red",
  };
  return map[status] || "gray";
}

export function getPriorityTagKind(priority: string): string {
  const map: Record<string, string> = {
    critical: "red",
    high: "warm-gray",
    medium: "blue",
    low: "gray",
  };
  return map[priority] || "gray";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
    blocked: "Blocked",
  };
  return map[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return map[priority] || priority;
}

export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    task: "Task",
    bug: "Bug",
    feature: "Feature",
    improvement: "Improvement",
  };
  return map[type] || type;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
