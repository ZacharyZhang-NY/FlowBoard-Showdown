"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type {
  CreateCommentRequest,
  CreateIssueRequest,
  IssueComment,
  IssueDetail,
  IssueSummary,
  UpdateCommentRequest,
  UpdateIssueRequest,
} from "@/src/modules/issues/contract/issue.schemas";
import { apiRequest } from "@/src/state/query/api-client";

type IssueListEnvelope = {
  items: IssueSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

type CommentsEnvelope = {
  items: IssueComment[];
};

type ActivityEnvelope = {
  items: IssueDetail["activity"];
};

export type IssueFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
  sprintId?: string;
  assigneeId?: string;
  labelId?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

const keys = {
  list: (projectId: string, search: string) => ["issues", "project", projectId, search] as const,
  detail: (issueId: string) => ["issues", issueId] as const,
  comments: (issueId: string) => ["issues", issueId, "comments"] as const,
  activity: (issueId: string) => ["issues", issueId, "activity"] as const,
};

function toSearchParams(filters: IssueFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export function useIssuesSuspense(projectId: string, filters: IssueFilters) {
  const search = toSearchParams(filters);

  return useSuspenseQuery({
    queryKey: keys.list(projectId, search),
    queryFn: () =>
      apiRequest<IssueListEnvelope>(`/api/v1/projects/${projectId}/issues?${search}`),
  });
}

export function useIssueSuspense(issueId: string) {
  return useSuspenseQuery({
    queryKey: keys.detail(issueId),
    queryFn: () => apiRequest<IssueDetail>(`/api/v1/issues/${issueId}`),
  });
}

export function useIssueCommentsSuspense(issueId: string) {
  return useSuspenseQuery({
    queryKey: keys.comments(issueId),
    queryFn: () =>
      apiRequest<CommentsEnvelope>(`/api/v1/issues/${issueId}/comments`),
  });
}

export function useIssueActivitySuspense(issueId: string) {
  return useSuspenseQuery({
    queryKey: keys.activity(issueId),
    queryFn: () =>
      apiRequest<ActivityEnvelope>(`/api/v1/issues/${issueId}/activity`),
  });
}

export function useCreateIssueMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIssueRequest) =>
      apiRequest<IssueDetail>(`/api/v1/projects/${projectId}/issues`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues", "project", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useUpdateIssueMutation(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateIssueRequest) =>
      apiRequest<IssueDetail>(`/api/v1/issues/${issueId}`, {
        method: "PUT",
        body: payload,
      }),
    onSuccess: (issue) => {
      void queryClient.invalidateQueries({ queryKey: keys.detail(issueId) });
      void queryClient.invalidateQueries({ queryKey: ["issues", "project", issue.projectId] });
      void queryClient.invalidateQueries({ queryKey: ["boards", issue.boardId] });
      void queryClient.invalidateQueries({ queryKey: ["sprints", "project", issue.projectId] });
    },
  });
}

export function useCreateCommentMutation(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentRequest) =>
      apiRequest<IssueComment>(`/api/v1/issues/${issueId}/comments`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.detail(issueId) });
      void queryClient.invalidateQueries({ queryKey: keys.comments(issueId) });
      void queryClient.invalidateQueries({ queryKey: keys.activity(issueId) });
    },
  });
}

export function useUpdateCommentMutation(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; payload: UpdateCommentRequest }) =>
      apiRequest<IssueComment>(`/api/v1/comments/${input.commentId}`, {
        method: "PUT",
        body: input.payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.detail(issueId) });
      void queryClient.invalidateQueries({ queryKey: keys.comments(issueId) });
    },
  });
}

export function useDeleteCommentMutation(issueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      apiRequest(`/api/v1/comments/${commentId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.detail(issueId) });
      void queryClient.invalidateQueries({ queryKey: keys.comments(issueId) });
    },
  });
}
