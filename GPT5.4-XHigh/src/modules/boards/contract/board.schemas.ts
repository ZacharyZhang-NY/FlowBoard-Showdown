import { z } from "zod";

import {
  idSchema,
  issuePrioritySchema,
  issueStatusSchema,
  issueTypeSchema,
  tagSchema,
  timestampSchema,
  userSummarySchema,
} from "@/src/shared/api/common.schemas";

export const boardColumnSchema = z.object({
  id: idSchema,
  boardId: idSchema,
  name: z.string().min(1),
  color: z.string().min(1),
  position: z.number().int(),
  wipLimit: z.number().int().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const boardSummarySchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1),
  position: z.number().int(),
  issueCount: z.number().int().min(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const boardIssueCardSchema = z.object({
  id: idSchema,
  boardId: idSchema,
  columnId: idSchema.nullable(),
  number: z.number().int().min(1),
  key: z.string().min(1),
  title: z.string().min(1),
  status: issueStatusSchema,
  priority: issuePrioritySchema,
  type: issueTypeSchema,
  position: z.number().int(),
  version: z.number().int().min(1),
  storyPoints: z.number().int().nullable(),
  dueDate: timestampSchema.nullable(),
  assignee: userSummarySchema.nullable(),
  labels: z.array(tagSchema),
  updatedAt: timestampSchema,
});

export const boardDetailSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1),
  position: z.number().int(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  columns: z.array(
    boardColumnSchema.extend({
      issues: z.array(boardIssueCardSchema),
    }),
  ),
});

export const boardFilterSchema = z.object({
  search: z.string().optional(),
  assigneeId: idSchema.optional(),
  priority: issuePrioritySchema.optional(),
  status: issueStatusSchema.optional(),
  type: issueTypeSchema.optional(),
  labelId: idSchema.optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1),
});

export const updateBoardSchema = createBoardSchema.partial();

export const createColumnSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1).default("gray"),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const updateColumnSchema = createColumnSchema.partial().extend({
  position: z.number().int().optional(),
});

export const reorderColumnsSchema = z.object({
  boardId: idSchema,
  columnIds: z.array(idSchema).min(1),
});

export type BoardDetail = z.infer<typeof boardDetailSchema>;
export type BoardSummary = z.infer<typeof boardSummarySchema>;
export type BoardIssueCard = z.infer<typeof boardIssueCardSchema>;
export type CreateBoardRequest = z.infer<typeof createBoardSchema>;
export type UpdateBoardRequest = z.infer<typeof updateBoardSchema>;
export type CreateColumnRequest = z.infer<typeof createColumnSchema>;
export type UpdateColumnRequest = z.infer<typeof updateColumnSchema>;
