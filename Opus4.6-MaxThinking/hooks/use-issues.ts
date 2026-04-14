"use client";

import { useState, useEffect, useCallback } from "react";
import type { IssueWithRelations, IssueDetail } from "@/types";

type IssueFilters = {
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  sprintId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function useIssues(projectId: string | null, filters: IssueFilters = {}) {
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.type) params.set("type", filters.type);
      if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
      if (filters.sprintId) params.set("sprintId", filters.sprintId);
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/v1/projects/${projectId}/issues?${params}`);
      const json = await res.json();
      if (json.data) {
        setIssues(json.data.issues);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters.status, filters.priority, filters.type, filters.assigneeId, filters.sprintId, filters.search, filters.page, filters.limit]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, total, loading, refetch: fetchIssues };
}

export function useIssueDetail(issueId: string | null) {
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/issues/${issueId}`);
      const json = await res.json();
      if (json.data) setIssue(json.data);
    } catch (err) {
      console.error("Failed to fetch issue:", err);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const updateIssue = useCallback(
    async (data: Record<string, unknown>) => {
      if (!issueId) return;
      const res = await fetch(`/api/v1/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.data) {
        setIssue((prev) => (prev ? { ...prev, ...json.data } : prev));
      }
      return json;
    },
    [issueId]
  );

  return { issue, loading, refetch: fetchIssue, updateIssue };
}
