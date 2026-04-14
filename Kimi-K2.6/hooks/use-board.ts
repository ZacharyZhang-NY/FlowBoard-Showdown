import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Board, Column, Issue } from "@/types";

interface BoardData extends Board {
  columns: Column[];
  issues: Issue[];
}

async function fetchBoard(id: string): Promise<BoardData> {
  const res = await fetch(`/api/v1/boards/${id}`);
  if (!res.ok) throw new Error("Failed to fetch board");
  const json = await res.json();
  return json.data;
}

export function useBoard(id: string) {
  return useQuery({ queryKey: ["board", id], queryFn: () => fetchBoard(id), enabled: !!id });
}

export function useMoveIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, columnId, position, status }: { issueId: string; columnId: string; position: number; status?: string }) => {
      const res = await fetch(`/api/v1/issues/${issueId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, position, status }),
      });
      if (!res.ok) throw new Error("Failed to move issue");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
      qc.invalidateQueries({ queryKey: ["issue", vars.issueId] });
    },
  });
}

export function useReorderIssues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; position: number; columnId: string }[]) => {
      const res = await fetch("/api/v1/issues/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to reorder issues");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create issue");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
