"use client";

import { useParams, useRouter } from "next/navigation";
import { Loading } from "@carbon/react";
import { Breadcrumb, BreadcrumbItem } from "@carbon/react";
import { useBoard } from "@/hooks/use-board";
import { useProjects } from "@/hooks/use-projects";
import BoardView from "@/components/board/BoardView";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { board, loading, refetch, moveIssue } = useBoard(boardId);
  const { projects } = useProjects();

  const project = projects[0];
  const projectKey = project?.key || "FB";

  if (loading) {
    return <Loading withOverlay={false} />;
  }

  if (!board) {
    return <p>Board not found</p>;
  }

  return (
    <div>
      <div className="page-header">
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/dashboard">
            {project?.name || "Project"}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{board.name}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <BoardView
        board={board}
        projectId={project?.id || ""}
        projectKey={projectKey}
        onIssueClick={(issueId) => router.push(`/issues/${issueId}`)}
        onMoveIssue={moveIssue}
        onRefresh={refetch}
      />
    </div>
  );
}
