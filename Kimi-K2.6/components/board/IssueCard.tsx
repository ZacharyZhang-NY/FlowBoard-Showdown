"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tile, Tag, OverflowMenu, OverflowMenuItem } from "@carbon/react";
import { Task, Debug, Code, Idea } from "@carbon/icons-react";
import Link from "next/link";
import type { Issue } from "@/types";
import { useDeleteIssue, useUpdateIssue } from "@/hooks/use-issues";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface IssueCardProps {
  issue: Issue;
  projectKey: string;
  isDragging?: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  task: Task,
  bug: Debug,
  feature: Code,
  improvement: Idea,
};

const priorityTagType: Record<string, string> = {
  critical: "red",
  high: "warm-gray",
  medium: "blue",
  low: "gray",
};

export function IssueCard({ issue, projectKey, isDragging }: IssueCardProps) {
  const router = useRouter();
  const deleteIssue = useDeleteIssue();
  const updateIssue = useUpdateIssue();
  const [hover, setHover] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableIsDragging ? 0.4 : 1,
  };

  const TypeIcon = typeIcons[issue.type] || Task;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Tile className="issue-card" style={{ marginBottom: "0.5rem", padding: "0.75rem", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Link href={`/issues/${issue.id}`} style={{ fontWeight: 500, fontSize: "0.875rem" }}>
            {projectKey}-{issue.number}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {issue.storyPoints != null && (
              <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                {issue.storyPoints} pts
              </span>
            )}
            <div style={{ visibility: hover ? "visible" : "hidden" }}>
              <OverflowMenu flipped ariaLabel="Issue actions" iconDescription="">
                <OverflowMenuItem
                  itemText="Edit"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    router.push(`/issues/${issue.id}`);
                  }}
                />
                <OverflowMenuItem
                  itemText="Move to backlog"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    updateIssue.mutate({ id: issue.id, data: { columnId: null, sprintId: null } });
                  }}
                />
                <OverflowMenuItem
                  itemText="Delete"
                  isDelete
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    deleteIssue.mutate(issue.id);
                  }}
                />
              </OverflowMenu>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "0.25rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <TypeIcon size={16} />
          <span>{issue.title}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
          <Tag type={priorityTagType[issue.priority] as any} size="sm">
            {issue.priority}
          </Tag>
          <UserAvatar name={issue.assignee?.name} size={20} />
        </div>
      </Tile>
    </div>
  );
}
