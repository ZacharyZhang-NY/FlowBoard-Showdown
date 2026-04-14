"use client";

import { useState, useEffect, useCallback } from "react";
import type { BoardWithColumns } from "@/types";

export function useBoard(boardId: string | null) {
  const [board, setBoard] = useState<BoardWithColumns | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/boards/${boardId}`);
      const json = await res.json();
      if (json.data) setBoard(json.data);
    } catch (err) {
      console.error("Failed to fetch board:", err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const moveIssue = useCallback(
    async (issueId: string, columnId: string, position: number) => {
      // Optimistic update
      setBoard((prev) => {
        if (!prev) return prev;
        const newColumns = prev.columns.map((col) => ({
          ...col,
          issues: col.issues.filter((i) => i.id !== issueId),
        }));

        const issue = prev.columns
          .flatMap((c) => c.issues)
          .find((i) => i.id === issueId);

        if (issue) {
          const targetCol = newColumns.find((c) => c.id === columnId);
          if (targetCol) {
            targetCol.issues.splice(position, 0, { ...issue, columnId, position });
            targetCol.issues.forEach((i, idx) => {
              i.position = idx;
            });
          }
        }

        return { ...prev, columns: newColumns };
      });

      // API call
      await fetch(`/api/v1/issues/${issueId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, position }),
      });
    },
    []
  );

  return { board, loading, refetch: fetchBoard, moveIssue };
}
