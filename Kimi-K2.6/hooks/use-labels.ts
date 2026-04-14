import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Label } from "@/types";

export function useLabels(projectId: string) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/labels`);
      if (!res.ok) throw new Error("Failed to fetch labels");
      const json = await res.json();
      return json.data as Label[];
    },
    enabled: !!projectId,
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Partial<Label> }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create label");
      return res.json();
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["labels", vars.projectId] }),
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/labels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete label");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}
