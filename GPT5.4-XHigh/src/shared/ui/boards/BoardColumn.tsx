"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Tag, Tile } from "@carbon/react";

import type { BoardDetail } from "@/src/modules/boards/contract/board.schemas";
import { InlineIssueComposer } from "@/src/shared/ui/boards/InlineIssueComposer";
import { IssueCard } from "@/src/shared/ui/boards/IssueCard";

type ColumnTagType = "gray" | "cool-gray" | "warm-gray" | "red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "outline" | "high-contrast";

type BoardColumnProps = {
  boardId: string;
  column: BoardDetail["columns"][number];
  onCreateIssue: (columnId: string, title: string) => Promise<void>;
  createBusy: boolean;
};

export function BoardColumn({
  boardId,
  column,
  onCreateIssue,
  createBusy,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "column",
    },
  });

  return (
    <Tile className="flowboard-board-column" ref={setNodeRef}>
      <div className="flowboard-board-column__header">
        <div>
          <h2>{column.name}</h2>
          <div className="flowboard-board-column__meta">
            <Tag type={column.color as ColumnTagType}>
              {column.issues.length}
            </Tag>
            {column.wipLimit ? <span>WIP {column.wipLimit}</span> : null}
          </div>
        </div>
      </div>
      <SortableContext
        items={column.issues.map((issue) => issue.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flowboard-board-column__body">
          {column.issues.map((issue) => (
            <IssueCard issue={issue} key={issue.id} />
          ))}
        </div>
      </SortableContext>
      <InlineIssueComposer
        busy={createBusy}
        onCreate={(title) => onCreateIssue(column.id, title)}
      />
    </Tile>
  );
}
