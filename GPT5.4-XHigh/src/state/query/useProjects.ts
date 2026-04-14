"use client";

import { useEffect } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import type {
  DashboardSummary,
  ProjectDetail,
  ProjectSummary,
} from "@/src/modules/projects/contract/project.schemas";
import { apiRequest } from "@/src/state/query/api-client";
import { useUiStore } from "@/src/state/stores/ui-store";

type ProjectListEnvelope = {
  items: ProjectSummary[];
};

type ProjectActivityItem = {
  id: string;
  action: string;
  requestId: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  issueId: string | null;
  issueKey: string | null;
  issueTitle: string | null;
  oldValue: string | null;
  newValue: string | null;
};

const keys = {
  all: ["projects"] as const,
  detail: (projectId: string) => ["projects", projectId] as const,
  dashboard: (projectId: string) => ["projects", projectId, "dashboard"] as const,
  activity: (projectId: string) => ["projects", projectId, "activity"] as const,
};

export function useProjectsQuery() {
  return useQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const response = await apiRequest<ProjectListEnvelope>("/api/v1/projects");
      return response.items;
    },
  });
}

export function useProjectsSuspense() {
  return useSuspenseQuery({
    queryKey: keys.all,
    queryFn: async () => {
      const response = await apiRequest<ProjectListEnvelope>("/api/v1/projects");
      return response.items;
    },
  });
}

export function useProjectSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.detail(projectId),
    queryFn: () => apiRequest<ProjectDetail>(`/api/v1/projects/${projectId}`),
  });
}

export function useDashboardSummarySuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.dashboard(projectId),
    queryFn: () => apiRequest<DashboardSummary>(`/api/v1/projects/${projectId}/dashboard`),
  });
}

export function useProjectActivitySuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.activity(projectId),
    queryFn: () =>
      apiRequest<ProjectActivityItem[]>(`/api/v1/projects/${projectId}/activity`),
  });
}

export function useCurrentProjectSuspense() {
  const { data: projects } = useProjectsSuspense();
  const activeProjectId = useUiStore((state) => state.activeProjectId);
  const setActiveProjectId = useUiStore((state) => state.setActiveProjectId);

  const currentProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null;

  useEffect(() => {
    if (currentProject && currentProject.id !== activeProjectId) {
      setActiveProjectId(currentProject.id);
    }
  }, [activeProjectId, currentProject, setActiveProjectId]);

  return {
    projects,
    currentProject,
  };
}
