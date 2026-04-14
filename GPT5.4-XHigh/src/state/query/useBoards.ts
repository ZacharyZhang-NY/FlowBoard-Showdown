"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import type {
  BoardDetail,
  BoardSummary,
  CreateColumnRequest,
  UpdateBoardRequest,
  UpdateColumnRequest,
} from "@/src/modules/boards/contract/board.schemas";
import type {
  CreateIssueRequest,
  MoveIssueRequest,
} from "@/src/modules/issues/contract/issue.schemas";
import { apiRequest } from "@/src/state/query/api-client";

type BoardListEnvelope = {
  items: BoardSummary[];
};

type BoardFilters = {
  search?: string;
  assigneeId?: string;
  priority?: string;
  status?: string;
  type?: string;
  labelId?: string;
};

const keys = {
  list: (projectId: string) => ["boards", "project", projectId] as const,
  detail: (boardId: string, search: string) => ["boards", boardId, search] as const,
};

function toSearchParams(filters: BoardFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
}

export function useBoardsSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.list(projectId),
    queryFn: async () => {
      const response = await apiRequest<BoardListEnvelope>(
        `/api/v1/projects/${projectId}/boards`,
      );
      return response.items;
    },
  });
}

export function useBoardSuspense(boardId: string, filters: BoardFilters) {
  const search = toSearchParams(filters);

  return useSuspenseQuery({
    queryKey: keys.detail(boardId, search),
    queryFn: () =>
      apiRequest<BoardDetail>(
        search ? `/api/v1/boards/${boardId}?${search}` : `/api/v1/boards/${boardId}`,
      ),
  });
}

export function useCreateIssueMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIssueRequest) =>
      apiRequest(`/api/v1/projects/${projectId}/issues`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["issues", "project", projectId] });
    },
  });
}

export function useMoveIssueMutation(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { issueId: string; payload: MoveIssueRequest }) =>
      apiRequest(`/api/v1/issues/${input.issueId}/move`, {
        method: "PUT",
        body: input.payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useCreateColumnMutation(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateColumnRequest) =>
      apiRequest(`/api/v1/boards/${boardId}/columns`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useUpdateColumnMutation(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { columnId: string; payload: UpdateColumnRequest }) =>
      apiRequest(`/api/v1/columns/${input.columnId}`, {
        method: "PUT",
        body: input.payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useDeleteColumnMutation(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) =>
      apiRequest(`/api/v1/columns/${columnId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useReorderColumnsMutation(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnIds: string[]) =>
      apiRequest("/api/v1/columns/reorder", {
        method: "PUT",
        body: {
          boardId,
          columnIds,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
    },
  });
}

export function useUpdateBoardMutation(boardId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBoardRequest) =>
      apiRequest(`/api/v1/boards/${boardId}`, {
        method: "PUT",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boards", boardId] });
      void queryClient.invalidateQueries({ queryKey: keys.list(projectId) });
    },
  });
}
