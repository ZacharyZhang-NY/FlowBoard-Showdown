"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type {
  LabelDto,
  CreateLabelRequest,
} from "@/src/modules/labels/contract/label.schemas";
import type { UpdateProjectRequest } from "@/src/modules/projects/contract/project.schemas";
import { apiRequest } from "@/src/state/query/api-client";

type LabelListEnvelope = {
  items: LabelDto[];
};

const keys = {
  labels: (projectId: string) => ["settings", "labels", projectId] as const,
};

export function useLabelsSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.labels(projectId),
    queryFn: () =>
      apiRequest<LabelListEnvelope>(`/api/v1/projects/${projectId}/labels`),
  });
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectRequest) =>
      apiRequest(`/api/v1/projects/${projectId}`, {
        method: "PUT",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiRequest(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateLabelMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLabelRequest) =>
      apiRequest<LabelDto>(`/api/v1/projects/${projectId}/labels`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.labels(projectId) });
    },
  });
}

export function useDeleteLabelMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) =>
      apiRequest(`/api/v1/labels/${labelId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.labels(projectId) });
    },
  });
}
