"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { BoardWithColumns } from "@/types";
import BoardColumn from "./BoardColumn";

type BoardViewProps = {
  board: BoardWithColumns;
  projectId: string;
  projectKey: string;
  onIssueClick: (issueId: string) => void;
  onMoveIssue: (issueId: string, columnId: string, position: number) => void;
  onRefresh: () => void;
};

export default function BoardView({
  board,
  projectId,
  projectKey,
  onIssueClick,
  onMoveIssue,
  onRefresh,
}: BoardViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Determine target column and position
      let targetColumnId: string;
      let targetPosition: number;

      const overData = over.data.current;
      if (overData?.type === "column") {
        // Dropped on an empty column
        targetColumnId = overId;
        targetPosition = 0;
      } else {
        // Dropped on or near another issue
        const overIssue = board.columns
          .flatMap((c) => c.issues)
          .find((i) => i.id === overId);

        if (overIssue) {
          targetColumnId = overIssue.columnId!;
          targetPosition = overIssue.position;
        } else {
          // Fallback: check if over is a column
          const col = board.columns.find((c) => c.id === overId);
          if (col) {
            targetColumnId = col.id;
            targetPosition = col.issues.length;
          } else {
            return;
          }
        }
      }

      if (activeId === overId) return;

      onMoveIssue(activeId, targetColumnId, targetPosition);
    },
    [board, onMoveIssue]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="board-container">
        {board.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            projectId={projectId}
            projectKey={projectKey}
            onIssueClick={onIssueClick}
            onIssueCreated={onRefresh}
          />
        ))}
      </div>
    </DndContext>
  );
}
