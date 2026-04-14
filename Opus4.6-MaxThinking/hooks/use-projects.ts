"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/projects");
      const json = await res.json();
      if (json.data) setProjects(json.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}

export function useProject(id: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/v1/projects/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setProject(json.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { project, loading };
}
