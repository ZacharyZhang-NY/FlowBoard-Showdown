import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, Comment, ActivityLogEntry } from "@/types";

export function useIssues(projectId: string, params?: Record<string, string>) {
  const queryString = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: ["issues", projectId, params],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/issues${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      const json = await res.json();
      return json.data as Issue[];
    },
    enabled: !!projectId,
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ["issue", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${id}`);
      if (!res.ok) throw new Error("Failed to fetch issue");
      const json = await res.json();
      return json.data as Issue;
    },
    enabled: !!id,
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Issue> }) => {
      const res = await fetch(`/api/v1/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update issue");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue", vars.id] });
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/issues/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete issue");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ["comments", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${issueId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const json = await res.json();
      return json.data as Comment[];
    },
    enabled: !!issueId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, content }: { issueId: string; content: string }) => {
      const res = await fetch(`/api/v1/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to create comment");
      return res.json();
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["comments", vars.issueId] }),
  });
}

export function useActivity(issueId: string) {
  return useQuery({
    queryKey: ["activity", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${issueId}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const json = await res.json();
      return json.data as ActivityLogEntry[];
    },
    enabled: !!issueId,
  });
}

export function useUpdateIssueLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, labelIds }: { id: string; labelIds: string[] }) => {
      const res = await fetch(`/api/v1/issues/${id}/labels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelIds }),
      });
      if (!res.ok) throw new Error("Failed to update labels");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue", vars.id] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useBulkUpdateIssues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<Issue> }) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/v1/issues/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`Failed to update issue ${id}`);
          return res.json();
        })
      );
      return results;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}
