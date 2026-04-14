"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sprint } from "@/types";

export function useSprints(projectId: string | null) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/projects/${projectId}/sprints`);
      const json = await res.json();
      if (json.data) setSprints(json.data);
    } catch (err) {
      console.error("Failed to fetch sprints:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  return { sprints, loading, refetch: fetchSprints };
}
