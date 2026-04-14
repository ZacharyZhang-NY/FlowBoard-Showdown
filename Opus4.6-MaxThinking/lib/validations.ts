import { z } from "zod";

// ─── Projects ────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  key: z.string().min(1, "Key is required").max(6).toUpperCase(),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  key: z.string().min(1).max(6).toUpperCase().optional(),
  description: z.string().optional(),
});

// ─── Boards ──────────────────────────────────────────────────────────────────

export const createBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

// ─── Columns ─────────────────────────────────────────────────────────────────

export const createColumnSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().default("gray"),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().optional(),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});

// ─── Issues ──────────────────────────────────────────────────────────────────

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]).default("todo"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  type: z.enum(["task", "bug", "feature", "improvement"]).default("task"),
  columnId: z.string().optional(),
  sprintId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  storyPoints: z.number().int().min(0).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  type: z.enum(["task", "bug", "feature", "improvement"]).optional(),
  columnId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  storyPoints: z.number().int().min(0).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

export const moveIssueSchema = z.object({
  columnId: z.string(),
  position: z.number().int().min(0),
});

export const reorderIssuesSchema = z.object({
  issues: z.array(
    z.object({
      id: z.string(),
      columnId: z.string(),
      position: z.number().int().min(0),
    })
  ),
});

// ─── Sprints ─────────────────────────────────────────────────────────────────

export const createSprintSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  goal: z.string().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const startSprintSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

// ─── Comments ────────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

// ─── Labels ──────────────────────────────────────────────────────────────────

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().default("blue"),
});
