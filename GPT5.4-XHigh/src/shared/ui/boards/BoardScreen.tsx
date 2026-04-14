"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Button,
  Dropdown,
  InlineNotification,
  Search,
} from "@carbon/react";
import { Filter, Settings } from "@carbon/icons-react";

import type { BoardDetail } from "@/src/modules/boards/contract/board.schemas";
import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { useBoardSuspense, useCreateIssueMutation, useMoveIssueMutation } from "@/src/state/query/useBoards";
import { useProjectSuspense } from "@/src/state/query/useProjects";
import { BoardColumn } from "@/src/shared/ui/boards/BoardColumn";

type BoardScreenProps = {
  boardId: string;
};

type FilterState = {
  search: string;
  priority: string;
  status: string;
  type: string;
  labelId: string;
  assigneeId: string;
};

const defaultFilters: FilterState = {
  search: "",
  priority: "",
  status: "",
  type: "",
  labelId: "",
  assigneeId: "",
};

function reorderBoard(
  board: BoardDetail,
  issueId: string,
  sourceColumnId: string,
  targetColumnId: string,
  targetIndex: number,
) {
  const nextColumns = board.columns.map((column) => ({
    ...column,
    issues: [...column.issues],
  }));
  const sourceColumn = nextColumns.find((column) => column.id === sourceColumnId);
  const targetColumn = nextColumns.find((column) => column.id === targetColumnId);

  if (!sourceColumn || !targetColumn) {
    return board;
  }

  const sourceIndex = sourceColumn.issues.findIndex((issue) => issue.id === issueId);
  if (sourceIndex === -1) {
    return board;
  }

  const [movedIssue] = sourceColumn.issues.splice(sourceIndex, 1);
  if (!movedIssue) {
    return board;
  }

  movedIssue.columnId = targetColumnId;

  if (sourceColumnId === targetColumnId) {
    targetColumn.issues = arrayMove(targetColumn.issues, sourceIndex, targetIndex);
  } else {
    targetColumn.issues.splice(targetIndex, 0, movedIssue);
  }

  return {
    ...board,
    columns: nextColumns,
  };
}

export function BoardScreen({ boardId }: BoardScreenProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { data: board } = useBoardSuspense(boardId, {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.labelId ? { labelId: filters.labelId } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
  });
  const { data: project } = useProjectSuspense(board.projectId);
  const [localBoard, setLocalBoard] = useState(board);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createIssueMutation = useCreateIssueMutation(project.id);
  const moveIssueMutation = useMoveIssueMutation(board.id);

  useEffect(() => {
    setLocalBoard(board);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const labelItems = useMemo(() => {
    const map = new Map<string, string>();
    localBoard.columns.flatMap((column) => column.issues).forEach((issue) => {
      issue.labels.forEach((label) => {
        map.set(label.id, label.name);
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [localBoard.columns]);

  const assigneeItems = useMemo(() => {
    const map = new Map<string, string>();
    localBoard.columns.flatMap((column) => column.issues).forEach((issue) => {
      if (issue.assignee) {
        map.set(issue.assignee.id, issue.assignee.name);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [localBoard.columns]);

  const handleCreateIssue = async (columnId: string, title: string) => {
    const targetColumn = localBoard.columns.find((column) => column.id === columnId);
    if (!targetColumn) {
      return;
    }

    try {
      setErrorMessage(null);
      await createIssueMutation.mutateAsync({
        boardId: localBoard.id,
        columnId,
        title,
        priority: "medium",
        status: "todo",
        type: "task",
        labelIds: [],
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Issue creation failed");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const sourceColumn = localBoard.columns.find((column) =>
      column.issues.some((issue) => issue.id === activeId),
    );
    const sameIssueTargetColumn = localBoard.columns.find((column) =>
      column.issues.some((issue) => issue.id === overId),
    );
    const targetColumn = localBoard.columns.find((column) => column.id === overId) ?? sameIssueTargetColumn;

    if (!sourceColumn || !targetColumn) {
      return;
    }

    const targetIndex =
      targetColumn.id === overId
        ? targetColumn.issues.length
        : targetColumn.issues.findIndex((issue) => issue.id === overId);
    const safeTargetIndex = targetIndex < 0 ? targetColumn.issues.length : targetIndex;
    const movedIssue = sourceColumn.issues.find((issue) => issue.id === activeId);

    if (!movedIssue) {
      return;
    }

    setLocalBoard((currentBoard) =>
      reorderBoard(
        currentBoard,
        activeId,
        sourceColumn.id,
        targetColumn.id,
        safeTargetIndex,
      ),
    );

    try {
      setErrorMessage(null);
      await moveIssueMutation.mutateAsync({
        issueId: activeId,
        payload: {
          boardId: localBoard.id,
          columnId: targetColumn.id,
          position: safeTargetIndex,
          version: movedIssue.version,
        },
      });
    } catch (error) {
      setLocalBoard(board);
      setErrorMessage(error instanceof Error ? error.message : "Issue move failed");
    }
  };

  const actions = (
    <>
      <Search
        closeButtonLabelText="Clear search"
        id="board-search"
        labelText=""
        onChange={(event) => {
          setFilters((current) => ({ ...current, search: event.target.value }));
        }}
        placeholder="Search issues"
        size="md"
        value={filters.search}
      />
      <Button kind="ghost" renderIcon={Filter}>
        Filters
      </Button>
      <Button kind="ghost" renderIcon={Settings}>
        Board settings
      </Button>
    </>
  );

  const summary = (
    <div className="flowboard-filter-row">
      <Dropdown
        id="board-priority-filter"
        itemToString={(item) => item?.label ?? ""}
        items={[
          { id: "", label: "All priorities" },
          { id: "critical", label: "Critical" },
          { id: "high", label: "High" },
          { id: "medium", label: "Medium" },
          { id: "low", label: "Low" },
        ]}
        label="Priority"
        onChange={({ selectedItem }) => {
          setFilters((current) => ({ ...current, priority: selectedItem?.id ?? "" }));
        }}
        selectedItem={null}
        titleText="Priority"
      />
      <Dropdown
        id="board-status-filter"
        itemToString={(item) => item?.label ?? ""}
        items={[
          { id: "", label: "All statuses" },
          { id: "todo", label: "To Do" },
          { id: "in_progress", label: "In Progress" },
          { id: "in_review", label: "In Review" },
          { id: "done", label: "Done" },
          { id: "blocked", label: "Blocked" },
        ]}
        label="Status"
        onChange={({ selectedItem }) => {
          setFilters((current) => ({ ...current, status: selectedItem?.id ?? "" }));
        }}
        selectedItem={null}
        titleText="Status"
      />
      <Dropdown
        id="board-type-filter"
        itemToString={(item) => item?.label ?? ""}
        items={[
          { id: "", label: "All types" },
          { id: "task", label: "Task" },
          { id: "bug", label: "Bug" },
          { id: "feature", label: "Feature" },
          { id: "improvement", label: "Improvement" },
        ]}
        label="Type"
        onChange={({ selectedItem }) => {
          setFilters((current) => ({ ...current, type: selectedItem?.id ?? "" }));
        }}
        selectedItem={null}
        titleText="Type"
      />
      <Dropdown
        id="board-assignee-filter"
        itemToString={(item) => item?.label ?? ""}
        items={[{ id: "", label: "All assignees" }, ...assigneeItems]}
        label="Assignee"
        onChange={({ selectedItem }) => {
          setFilters((current) => ({ ...current, assigneeId: selectedItem?.id ?? "" }));
        }}
        selectedItem={null}
        titleText="Assignee"
      />
      <Dropdown
        id="board-label-filter"
        itemToString={(item) => item?.label ?? ""}
        items={[{ id: "", label: "All labels" }, ...labelItems]}
        label="Label"
        onChange={({ selectedItem }) => {
          setFilters((current) => ({ ...current, labelId: selectedItem?.id ?? "" }));
        }}
        selectedItem={null}
        titleText="Label"
      />
    </div>
  );

  return (
    <PageLayout
      actions={actions}
      breadcrumb={[
        { href: "/dashboard", label: project.name },
        { label: localBoard.name },
      ]}
      description="Drag issues across delivery stages and update order in place."
      summary={summary}
      title={localBoard.name}
    >
      {errorMessage ? (
        <InlineNotification
          hideCloseButton
          kind="error"
          lowContrast
          subtitle={errorMessage}
          title="Board action failed"
        />
      ) : null}
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flowboard-board">
          {localBoard.columns.map((column) => (
            <BoardColumn
              boardId={localBoard.id}
              column={column}
              createBusy={createIssueMutation.isPending}
              key={column.id}
              onCreateIssue={handleCreateIssue}
            />
          ))}
        </div>
      </DndContext>
    </PageLayout>
  );
}
