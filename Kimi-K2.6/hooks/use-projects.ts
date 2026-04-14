import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/types";

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/v1/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  const json = await res.json();
  return json.data;
}

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
