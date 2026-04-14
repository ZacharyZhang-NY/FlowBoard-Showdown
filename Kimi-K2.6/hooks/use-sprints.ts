import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sprint } from "@/types";

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`);
      if (!res.ok) throw new Error("Failed to fetch sprints");
      const json = await res.json();
      return json.data as Sprint[];
    },
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Partial<Sprint> }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sprint");
      return res.json();
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["sprints", vars.projectId] }),
  });
}

export function useStartSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, startDate, endDate }: { sprintId: string; startDate: string; endDate: string }) => {
      const res = await fetch(`/api/v1/sprints/${sprintId}/start`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to start sprint");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
  });
}

export function useCompleteSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, moveToBacklogIssueIds }: { sprintId: string; moveToBacklogIssueIds?: string[] }) => {
      const res = await fetch(`/api/v1/sprints/${sprintId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveToBacklogIssueIds }),
      });
      if (!res.ok) throw new Error("Failed to complete sprint");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useBurndown(projectId: string) {
  return useQuery({
    queryKey: ["burndown", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/reports/burndown`);
      if (!res.ok) throw new Error("Failed to fetch burndown");
      const json = await res.json();
      return json.data as { dates: string[]; ideal: number[]; actual: number[] };
    },
    enabled: !!projectId,
  });
}
