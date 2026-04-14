"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { useBoard, useMoveIssue, useReorderIssues, useCreateIssue } from "@/hooks/use-board";
import { useProjects } from "@/hooks/use-projects";
import { useLabels } from "@/hooks/use-labels";
import { BoardColumn } from "./BoardColumn";
import { IssueCard } from "./IssueCard";
import type { Issue, Column } from "@/types";
import {
  Button,
  Breadcrumb,
  BreadcrumbItem,
  Search,
  Dropdown,
  OverflowMenu,
  OverflowMenuItem,
  Loading,
} from "@carbon/react";
import Link from "next/link";

export function BoardView({ boardId }: { boardId: string }) {
  const { data: boardData, isLoading } = useBoard(boardId);
  const { data: projects } = useProjects();
  const project = projects?.[0];
  const projectId = project?.id || "";
  const { data: labels } = useLabels(projectId);
  const moveIssue = useMoveIssue();
  const reorderIssues = useReorderIssues();
  const createIssue = useCreateIssue();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, Issue[]>>({});
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => boardData?.columns || [], [boardData]);
  const issues = useMemo(() => boardData?.issues || [], [boardData]);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((i) => {
      if (i.assigneeId && i.assignee?.name) map.set(i.assigneeId, i.assignee.name);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const matchesSearch =
        search.trim() === "" ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        String(i.number).includes(search);
      const matchesAssignee = !filterAssignee || i.assigneeId === filterAssignee;
      const matchesPriority = !filterPriority || i.priority === filterPriority;
      const matchesType = !filterType || i.type === filterType;
      const matchesLabel =
        !filterLabel ||
        i.labels?.some((l) => l.id === filterLabel);
      return matchesSearch && matchesAssignee && matchesPriority && matchesType && matchesLabel;
    });
  }, [issues, search, filterAssignee, filterPriority, filterType, filterLabel]);

  useMemo(() => {
    const map: Record<string, Issue[]> = {};
    for (const col of columns) {
      map[col.id] = filteredIssues
        .filter((i) => i.columnId === col.id)
        .sort((a, b) => a.position - b.position);
    }
    setItems(map);
  }, [columns, filteredIssues]);

  const activeIssue = useMemo(
    () => issues.find((i) => i.id === activeId),
    [activeId, issues]
  );

  const announcements = useMemo(
    () => ({
      onDragStart({ active }: { active: { id: string | number } }) {
        return `Picked up issue ${active.id}.`;
      },
      onDragOver({ active, over }: { active: { id: string | number }; over?: { id: string | number } | null }) {
        return over ? `Issue ${active.id} is over column ${over.id}.` : `Issue ${active.id} is no longer over a column.`;
      },
      onDragEnd({ active, over }: { active: { id: string | number }; over?: { id: string | number } | null }) {
        return over
          ? `Issue ${active.id} was dropped over column ${over.id}.`
          : `Issue ${active.id} was dropped.`;
      },
      onDragCancel({ active }: { active: { id: string | number } }) {
        return `Dragging issue ${active.id} was cancelled.`;
      },
    }),
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;

    const activeColId = findColumnId(items, activeIdStr);
    const overColId = findColumnId(items, overId) || overId;

    if (!activeColId || !overColId || activeColId === overColId) return;

    setItems((prev) => {
      const activeItems = [...prev[activeColId]];
      const overItems = [...prev[overColId]];
      const activeIndex = activeItems.findIndex((i) => i.id === activeIdStr);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      if (activeIndex === -1) return prev;

      const [moved] = activeItems.splice(activeIndex, 1);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(newIndex, 0, { ...moved, columnId: overColId });

      return { ...prev, [activeColId]: activeItems, [overColId]: overItems };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;

    const activeColId = findColumnId(items, activeIdStr);
    const overColId = findColumnId(items, overId) || overId;

    if (!activeColId || !overColId) return;

    if (activeColId === overColId) {
      const colItems = items[activeColId];
      const oldIndex = colItems.findIndex((i) => i.id === activeIdStr);
      const newIndex = colItems.findIndex((i) => i.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(colItems, oldIndex, newIndex);
        setItems((prev) => ({ ...prev, [activeColId]: reordered }));
        reorderIssues.mutate(
          reordered.map((i, idx) => ({ id: i.id, position: idx, columnId: activeColId }))
        );
      }
    } else {
      const colItems = items[overColId];
      const newIndex = colItems.findIndex((i) => i.id === activeIdStr);
      if (newIndex !== -1) {
        const targetCol = columns.find((c) => c.id === overColId);
        const newStatus = targetCol ? statusForColumn(targetCol.color) : undefined;
        moveIssue.mutate({ issueId: activeIdStr, columnId: overColId, position: newIndex, status: newStatus });
        reorderIssues.mutate(
          colItems.map((i, idx) => ({ id: i.id, position: idx, columnId: overColId }))
        );
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  if (isLoading) return <Loading />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ flex: "1 1 auto" }}>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link href="/dashboard">Project</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>{boardData?.name || "Board"}</BreadcrumbItem>
          </Breadcrumb>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Search
            size="sm"
            placeholder="Search issues"
            labelText="Search"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
          <Dropdown
            id="filter-assignee"
            titleText=""
            label="Assignee"
            size="sm"
            items={[{ id: "", label: "All" }, ...assignees]}
            selectedItem={filterAssignee ? assignees.find((a) => a.id === filterAssignee) || { id: "", label: "All" } : { id: "", label: "All" }}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => setFilterAssignee(selectedItem?.id || null)}
            style={{ minWidth: 140 }}
          />
          <Dropdown
            id="filter-priority"
            titleText=""
            label="Priority"
            size="sm"
            items={[
              { id: "", label: "All" },
              { id: "critical", label: "Critical" },
              { id: "high", label: "High" },
              { id: "medium", label: "Medium" },
              { id: "low", label: "Low" },
            ]}
            selectedItem={
              filterPriority
                ? { id: filterPriority, label: filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1) }
                : { id: "", label: "All" }
            }
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => setFilterPriority(selectedItem?.id || null)}
            style={{ minWidth: 120 }}
          />
          <Dropdown
            id="filter-type"
            titleText=""
            label="Type"
            size="sm"
            items={[
              { id: "", label: "All" },
              { id: "task", label: "Task" },
              { id: "bug", label: "Bug" },
              { id: "feature", label: "Feature" },
              { id: "improvement", label: "Improvement" },
            ]}
            selectedItem={
              filterType
                ? { id: filterType, label: filterType.charAt(0).toUpperCase() + filterType.slice(1) }
                : { id: "", label: "All" }
            }
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => setFilterType(selectedItem?.id || null)}
            style={{ minWidth: 130 }}
          />
          <Dropdown
            id="filter-label"
            titleText=""
            label="Label"
            size="sm"
            items={[{ id: "", label: "All" }, ...(labels || []).map((l) => ({ id: l.id, label: l.name }))]}
            selectedItem={filterLabel ? { id: filterLabel, label: labels?.find((l) => l.id === filterLabel)?.name || "All" } : { id: "", label: "All" }}
            itemToString={(item) => item?.label || ""}
            onChange={({ selectedItem }) => setFilterLabel(selectedItem?.id || null)}
            style={{ minWidth: 140 }}
          />
          <OverflowMenu flipped ariaLabel="Board settings">
            <OverflowMenuItem itemText="Board settings" />
            <OverflowMenuItem itemText="Export board" />
          </OverflowMenu>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements }}
      >
        <div className="kanban-board" style={{ flex: 1 }}>
          {columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              issues={items[col.id] || []}
              projectKey={project?.key || "FB"}
              onAdd={(title) =>
                createIssue.mutate({
                  projectId: boardData?.projectId || "",
                  data: { title, columnId: col.id, status: statusForColumn(col.color) },
                })
              }
            />
          ))}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeIssue ? <IssueCard issue={activeIssue} projectKey={project?.key || "FB"} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function findColumnId(items: Record<string, Issue[]>, issueId: string): string | null {
  for (const [colId, list] of Object.entries(items)) {
    if (list.some((i) => i.id === issueId)) return colId;
  }
  return null;
}

function statusForColumn(color: string): string {
  switch (color) {
    case "blue":
      return "in_progress";
    case "purple":
      return "in_review";
    case "green":
      return "done";
    case "red":
      return "blocked";
    default:
      return "todo";
  }
}
