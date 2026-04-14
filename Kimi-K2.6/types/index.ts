export type IssueStatus = "todo" | "in_progress" | "in_review" | "done" | "blocked";
export type IssuePriority = "critical" | "high" | "medium" | "low";
export type IssueType = "task" | "bug" | "feature" | "improvement";
export type SprintStatus = "planning" | "active" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: string | Date;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color: string;
  wipLimit?: number | null;
  issues?: Issue[];
}

export interface Issue {
  id: string;
  projectId: string;
  columnId?: string | null;
  sprintId?: string | null;
  number: number;
  title: string;
  description?: string | null;
  status: IssueStatus | string;
  priority: IssuePriority | string;
  type: IssueType | string;
  assigneeId?: string | null;
  reporterId: string;
  position: number;
  storyPoints?: number | null;
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignee?: User | null;
  reporter?: User;
  sprint?: Sprint | null;
  labels?: Label[];
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status: SprintStatus | string;
  createdAt: string | Date;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: User;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface ActivityLogEntry {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string | Date;
  user?: User;
  issue?: { number?: number | null } | null;
}
