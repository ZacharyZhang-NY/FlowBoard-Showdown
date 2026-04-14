import { z } from "zod";

import {
  idSchema,
  issueStatusSchema,
  sprintStatusSchema,
  timestampSchema,
} from "@/src/shared/api/common.schemas";
import { issueSummarySchema } from "@/src/modules/issues/contract/issue.schemas";

export const sprintSummarySchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1),
  goal: z.string().nullable(),
  status: sprintStatusSchema,
  startDate: timestampSchema.nullable(),
  endDate: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const sprintDetailSchema = sprintSummarySchema.extend({
  totalStoryPoints: z.number().int().min(0),
  completedStoryPoints: z.number().int().min(0),
  issuesByStatus: z.object({
    todo: z.array(issueSummarySchema),
    in_progress: z.array(issueSummarySchema),
    in_review: z.array(issueSummarySchema),
    done: z.array(issueSummarySchema),
    blocked: z.array(issueSummarySchema),
  }),
});

export const createSprintSchema = z.object({
  name: z.string().min(1),
  goal: z.string().max(1000).nullable().optional(),
});

export const updateSprintSchema = createSprintSchema.partial();

export const startSprintSchema = z.object({
  startDate: timestampSchema,
  endDate: timestampSchema,
});

export const completeSprintSchema = z.object({
  moveIncompleteIssuesToBacklog: z.boolean().default(true),
});

export type SprintSummary = z.infer<typeof sprintSummarySchema>;
export type SprintDetail = z.infer<typeof sprintDetailSchema>;
export type CreateSprintRequest = z.infer<typeof createSprintSchema>;
export type UpdateSprintRequest = z.infer<typeof updateSprintSchema>;
