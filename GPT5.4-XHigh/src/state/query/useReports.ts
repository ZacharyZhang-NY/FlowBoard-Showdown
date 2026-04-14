"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { apiRequest } from "@/src/state/query/api-client";

type BurndownResponse = {
  ideal: Array<{ date: string; value: number }>;
  actual: Array<{ date: string; value: number }>;
};

type VelocityResponse = {
  items: Array<{ sprintName: string; committed: number; completed: number }>;
};

type DistributionResponse = {
  items: Array<{ status: string; count: number }>;
};

type PriorityBreakdownResponse = {
  items: Array<{ sprintName: string; priority: string; count: number }>;
};

type CumulativeFlowResponse = {
  items: Array<{ date: string; status: string; count: number }>;
};

const keys = {
  burndown: (projectId: string) => ["reports", projectId, "burndown"] as const,
  velocity: (projectId: string) => ["reports", projectId, "velocity"] as const,
  distribution: (projectId: string) => ["reports", projectId, "distribution"] as const,
  priority: (projectId: string) => ["reports", projectId, "priority-breakdown"] as const,
  flow: (projectId: string) => ["reports", projectId, "cumulative-flow"] as const,
};

export function useBurndownSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.burndown(projectId),
    queryFn: () =>
      apiRequest<BurndownResponse>(`/api/v1/projects/${projectId}/reports/burndown`),
  });
}

export function useVelocitySuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.velocity(projectId),
    queryFn: () =>
      apiRequest<VelocityResponse>(`/api/v1/projects/${projectId}/reports/velocity`),
  });
}

export function useDistributionSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.distribution(projectId),
    queryFn: () =>
      apiRequest<DistributionResponse>(`/api/v1/projects/${projectId}/reports/distribution`),
  });
}

export function usePriorityBreakdownSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.priority(projectId),
    queryFn: () =>
      apiRequest<PriorityBreakdownResponse>(
        `/api/v1/projects/${projectId}/reports/priority-breakdown`,
      ),
  });
}

export function useCumulativeFlowSuspense(projectId: string) {
  return useSuspenseQuery({
    queryKey: keys.flow(projectId),
    queryFn: () =>
      apiRequest<CumulativeFlowResponse>(
        `/api/v1/projects/${projectId}/reports/cumulative-flow`,
      ),
  });
}
