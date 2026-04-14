"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type {
  CreateSprintRequest,
  SprintDetail,
} from "@/src/modules/sprints/contract/sprint.schemas";
import type { UpdateIssueRequest } from "@/src/modules/issues/contract/issue.schemas";
import { apiRequest } from "@/src/state/query/api-client";

type SprintListEnvelope = {
  items: SprintDetail[];
};

const keys = {
  list: (projectId: string) => ["sprints", "project", projectId] as const,
};

export function useSprintsSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.list(projectId),
    queryFn: () =>
      apiRequest<SprintListEnvelope>(`/api/v1/projects/${projectId}/sprints`),
  });
}

export function useCreateSprintMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSprintRequest) =>
      apiRequest<SprintDetail>(`/api/v1/projects/${projectId}/sprints`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
    },
  });
}

export function useStartSprintMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sprintId: string; startDate: string; endDate: string }) =>
      apiRequest<SprintDetail>(`/api/v1/sprints/${input.sprintId}/start`, {
        method: "PUT",
        body: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
    },
  });
}

export function useCompleteSprintMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sprintId: string; moveIncompleteIssuesToBacklog: boolean }) =>
      apiRequest<SprintDetail>(`/api/v1/sprints/${input.sprintId}/complete`, {
        method: "PUT",
        body: {
          moveIncompleteIssuesToBacklog: input.moveIncompleteIssuesToBacklog,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["issues", "project", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
    },
  });
}

export function useAssignIssueToSprintMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { issueId: string; payload: UpdateIssueRequest }) =>
      apiRequest(`/api/v1/issues/${input.issueId}`, {
        method: "PUT",
        body: input.payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["issues", "project", projectId] });
    },
  });
}
