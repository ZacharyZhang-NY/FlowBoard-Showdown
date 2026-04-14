import { z } from "zod";

import {
  issuePriorityValues,
  issueStatusValues,
  issueTypeValues,
  memberRoleValues,
  sprintStatusValues,
  themeModeValues,
} from "@/src/shared/types/domain";

export const idSchema = z.string().min(1);
export const timestampSchema = z.string().datetime();
export const nullableTimestampSchema = timestampSchema.nullable();
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const sortDirectionSchema = z.enum(["asc", "desc"]);

export const issueStatusSchema = z.enum(issueStatusValues);
export const issuePrioritySchema = z.enum(issuePriorityValues);
export const issueTypeSchema = z.enum(issueTypeValues);
export const sprintStatusSchema = z.enum(sprintStatusValues);
export const memberRoleSchema = z.enum(memberRoleValues);
export const themeModeSchema = z.enum(themeModeValues);

export const userSummarySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  image: z.string().nullable(),
});

export const tagSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  color: z.string().min(1),
});

export const activityItemSchema = z.object({
  id: idSchema,
  action: z.string().min(1),
  requestId: z.string().min(1),
  createdAt: timestampSchema,
  actor: userSummarySchema,
  issueId: idSchema.nullable(),
  issueKey: z.string().nullable(),
  issueTitle: z.string().nullable(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
});

export const paginatedMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  pageCount: z.number().int().min(0),
});
