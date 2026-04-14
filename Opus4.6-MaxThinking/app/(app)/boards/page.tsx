"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading, Tile, Button } from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { useProjects } from "@/hooks/use-projects";
import type { Board } from "@/types";
import EmptyState from "@/components/shared/EmptyState";
import { Template as BoardIcon } from "@carbon/icons-react";

export default function BoardsPage() {
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = projects[0]?.id;

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/v1/projects/${projectId}/boards`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setBoards(json.data);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (projectsLoading || loading) {
    return <Loading withOverlay={false} />;
  }

  if (boards.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Boards</h1>
        </div>
        <EmptyState
          icon={<BoardIcon size={48} />}
          title="No boards yet"
          description="Create a board to start organizing your issues."
        />
      </div>
    );
  }

  // If there's only one board, redirect to it
  if (boards.length === 1) {
    router.push(`/boards/${boards[0].id}`);
    return <Loading withOverlay={false} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Boards</h1>
      </div>
      <div className="dashboard-grid">
        {boards.map((board) => (
          <Tile
            key={board.id}
            className="stat-card"
            onClick={() => router.push(`/boards/${board.id}`)}
            style={{ cursor: "pointer" }}
          >
            <h3>{board.name}</h3>
          </Tile>
        ))}
      </div>
    </div>
  );
}
