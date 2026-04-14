"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Tile, OverflowMenu, OverflowMenuItem } from "@carbon/react";
import type { Column, Issue } from "@/types";
import { IssueCard } from "./IssueCard";
import { InlineCreateIssue } from "./InlineCreateIssue";

interface BoardColumnProps {
  column: Column;
  issues: Issue[];
  projectKey: string;
  onAdd: (title: string) => void;
}

export function BoardColumn({ column, issues, projectKey, onAdd }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const overLimit = column.wipLimit && issues.length > column.wipLimit;

  return (
    <Tile className="kanban-column">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          fontWeight: 600,
        }}
      >
        <span>
          {column.name} ({issues.length})
          {column.wipLimit ? ` / ${column.wipLimit}` : ""}
        </span>
        {overLimit && <span style={{ color: "var(--cds-support-error)" }}>Over limit</span>}
      </div>

      <div ref={setNodeRef} className="kanban-column-content">
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} projectKey={projectKey} />
          ))}
        </SortableContext>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <InlineCreateIssue onSubmit={onAdd} />
      </div>
    </Tile>
  );
}
