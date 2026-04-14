import { z } from "zod";

import { issuePrioritySchema, issueStatusSchema, timestampSchema } from "@/src/shared/api/common.schemas";

export const timeSeriesPointSchema = z.object({
  date: timestampSchema,
  value: z.number(),
});

export const burndownResponseSchema = z.object({
  ideal: z.array(timeSeriesPointSchema),
  actual: z.array(timeSeriesPointSchema),
});

export const velocityResponseSchema = z.object({
  items: z.array(
    z.object({
      sprintName: z.string().min(1),
      committed: z.number().int().min(0),
      completed: z.number().int().min(0),
    }),
  ),
});

export const distributionResponseSchema = z.object({
  items: z.array(
    z.object({
      status: issueStatusSchema,
      count: z.number().int().min(0),
    }),
  ),
});

export const priorityBreakdownResponseSchema = z.object({
  items: z.array(
    z.object({
      sprintName: z.string().min(1),
      priority: issuePrioritySchema,
      count: z.number().int().min(0),
    }),
  ),
});

export const cumulativeFlowResponseSchema = z.object({
  items: z.array(
    z.object({
      date: timestampSchema,
      status: issueStatusSchema,
      count: z.number().int().min(0),
    }),
  ),
});

export type BurndownResponse = z.infer<typeof burndownResponseSchema>;
export type VelocityResponse = z.infer<typeof velocityResponseSchema>;
export type DistributionResponse = z.infer<typeof distributionResponseSchema>;
export type PriorityBreakdownResponse = z.infer<typeof priorityBreakdownResponseSchema>;
export type CumulativeFlowResponse = z.infer<typeof cumulativeFlowResponseSchema>;
