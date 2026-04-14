import { z } from "zod";

import {
  activityItemSchema,
  idSchema,
  issuePrioritySchema,
  issueStatusSchema,
  issueTypeSchema,
  paginatedMetaSchema,
  sortDirectionSchema,
  tagSchema,
  timestampSchema,
  userSummarySchema,
} from "@/src/shared/api/common.schemas";

export const issueSummarySchema = z.object({
  id: idSchema,
  projectId: idSchema,
  boardId: idSchema,
  columnId: idSchema.nullable(),
  sprintId: idSchema.nullable(),
  number: z.number().int().min(1),
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: issueStatusSchema,
  priority: issuePrioritySchema,
  type: issueTypeSchema,
  storyPoints: z.number().int().nullable(),
  dueDate: timestampSchema.nullable(),
  position: z.number().int(),
  version: z.number().int().min(1),
  assignee: userSummarySchema.nullable(),
  reporter: userSummarySchema,
  labels: z.array(tagSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const commentSchema = z.object({
  id: idSchema,
  issueId: idSchema,
  author: userSummarySchema,
  content: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const issueDetailSchema = issueSummarySchema.extend({
  comments: z.array(commentSchema),
  activity: z.array(activityItemSchema),
});

export const issueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  type: issueTypeSchema.optional(),
  sprintId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  labelId: idSchema.optional(),
  sortBy: z
    .enum([
      "updatedAt",
      "dueDate",
      "priority",
      "status",
      "type",
      "storyPoints",
      "number",
      "title",
    ])
    .default("updatedAt"),
  sortDirection: sortDirectionSchema.default("desc"),
});

export const createIssueSchema = z.object({
  boardId: idSchema,
  columnId: idSchema.nullable().optional(),
  sprintId: idSchema.nullable().optional(),
  title: z.string().min(1),
  description: z.string().max(5000).nullable().optional(),
  priority: issuePrioritySchema.default("medium"),
  status: issueStatusSchema.default("todo"),
  type: issueTypeSchema.default("task"),
  assigneeId: idSchema.nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  dueDate: timestampSchema.nullable().optional(),
  labelIds: z.array(idSchema).default([]),
});

export const updateIssueSchema = createIssueSchema
  .partial()
  .extend({
    version: z.number().int().min(1),
  });

export const moveIssueSchema = z.object({
  boardId: idSchema,
  columnId: idSchema.nullable(),
  position: z.number().int(),
  version: z.number().int().min(1),
});

export const reorderIssuesSchema = z.object({
  boardId: idSchema,
  columnId: idSchema.nullable(),
  issueIds: z.array(idSchema).min(1),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const issueListResponseSchema = z.object({
  items: z.array(issueSummarySchema),
  meta: paginatedMetaSchema,
});

export type IssueSummary = z.infer<typeof issueSummarySchema>;
export type IssueDetail = z.infer<typeof issueDetailSchema>;
export type IssueComment = z.infer<typeof commentSchema>;
export type CreateIssueRequest = z.infer<typeof createIssueSchema>;
export type UpdateIssueRequest = z.infer<typeof updateIssueSchema>;
export type MoveIssueRequest = z.infer<typeof moveIssueSchema>;
export type ReorderIssuesRequest = z.infer<typeof reorderIssuesSchema>;
export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
export type UpdateCommentRequest = z.infer<typeof updateCommentSchema>;
