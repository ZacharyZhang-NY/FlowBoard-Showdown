import { z } from "zod";

import {
  activityItemSchema,
  idSchema,
  memberRoleSchema,
  paginatedMetaSchema,
  timestampSchema,
  userSummarySchema,
} from "@/src/shared/api/common.schemas";

export const projectSummarySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  key: z.string().min(1).max(10),
  description: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  boardCount: z.number().int().min(0),
  openIssueCount: z.number().int().min(0),
});

export const projectDetailSchema = projectSummarySchema.extend({
  createdBy: userSummarySchema,
  currentSprintId: idSchema.nullable(),
});

export const projectMemberSchema = z.object({
  projectId: idSchema,
  role: memberRoleSchema,
  user: userSummarySchema,
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(2).max(10).regex(/^[A-Z0-9_-]+$/),
  description: z.string().max(500).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsResponseSchema = z.object({
  items: z.array(projectSummarySchema),
  meta: paginatedMetaSchema.optional(),
});

export const dashboardMetricSchema = z.object({
  label: z.string().min(1),
  value: z.number().int().min(0),
  trend: z.number().int(),
});

export const dashboardSummarySchema = z.object({
  openIssues: dashboardMetricSchema,
  myAssigned: dashboardMetricSchema,
  overdue: dashboardMetricSchema,
  activeSprint: z.object({
    id: idSchema.nullable(),
    name: z.string().nullable(),
    completedStoryPoints: z.number().int().min(0),
    totalStoryPoints: z.number().int().min(0),
  }),
  recentActivity: z.array(activityItemSchema),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type ProjectMember = z.infer<typeof projectMemberSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
