"use client";

import { Tag } from "@carbon/react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ColumnWithIssues } from "@/types";
import IssueCard from "./IssueCard";
import InlineCreateIssue from "./InlineCreateIssue";

type BoardColumnProps = {
  column: ColumnWithIssues;
  projectId: string;
  projectKey: string;
  onIssueClick: (issueId: string) => void;
  onIssueCreated: () => void;
};

const COLOR_MAP = {
  gray: "gray",
  blue: "blue",
  purple: "purple",
  green: "green",
  red: "red",
} as const;

export default function BoardColumn({
  column,
  projectId,
  projectKey,
  onIssueClick,
  onIssueCreated,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const issueIds = column.issues.map((i) => i.id);

  return (
    <div
      className="board-column"
      style={{
        borderTop: isOver ? "2px solid var(--cds-interactive)" : undefined,
      }}
    >
      <div className="board-column-header">
        <h4>
          <Tag
            size="sm"
            type={COLOR_MAP[column.color as keyof typeof COLOR_MAP] || "gray"}
          >
            {column.name}
          </Tag>
          <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
            {column.issues.length}
            {column.wipLimit != null && ` / ${column.wipLimit}`}
          </span>
        </h4>
      </div>
      <div ref={setNodeRef} className="board-column-body">
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {column.issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectKey={projectKey}
              onClick={onIssueClick}
            />
          ))}
        </SortableContext>
        <InlineCreateIssue
          projectId={projectId}
          columnId={column.id}
          onCreated={onIssueCreated}
        />
      </div>
    </div>
  );
}
