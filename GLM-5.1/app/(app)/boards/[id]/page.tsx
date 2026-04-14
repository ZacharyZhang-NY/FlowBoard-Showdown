"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Tile, Tag, TextInput, Button, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem } from "@carbon/react";
import { getStatusTagKind, getStatusLabel, getPriorityTagKind, getPriorityLabel } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface ColumnData { id: string; name: string; position: number; color: string; wipLimit: number | null; issues: IssueData[] }
interface IssueData { id: string; number: number; title: string; status: string; priority: string; type: string; assigneeId: string | null; storyPoints: number | null; position: number }
interface BoardData { id: string; name: string; columns: ColumnData[]; projectId: string }

function SortableIssueCard({ issue, projectKey }: { issue: IssueData; projectKey: string }) {
  return (
    <Tile
      style={{ padding: 12, marginBottom: 8, cursor: "grab", minHeight: 60 }}
      onClick={() => window.location.href = `/issues/${issue.id}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>{projectKey}-{issue.number}</span>
        <Tag kind={getPriorityTagKind(issue.priority) as "gray" | "blue" | "red" | "warm-gray"} size="sm">{getPriorityLabel(issue.priority)}</Tag>
      </div>
      <p style={{ fontSize: 14, margin: "4px 0" }}>{issue.title}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tag kind={getStatusTagKind(issue.status) as "gray" | "blue" | "purple" | "green" | "red"} size="sm">{getStatusLabel(issue.status)}</Tag>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {issue.storyPoints && <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>{issue.storyPoints} SP</span>}
        </div>
      </div>
    </Tile>
  );
}

function InlineCreateIssue({ columnId, onCreate }: { columnId: string; onCreate: () => void }) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    await fetch("/api/v1/issues/reorder", { method: "PUT", body: JSON.stringify({ issues: [] }), headers: { "Content-Type": "application/json" } });
    setTitle("");
    setOpen(false);
    onCreate();
  };

  if (!open) return <Button kind="ghost" size="sm" onClick={() => setOpen(true)}>+ Add</Button>;

  return (
    <div style={{ padding: 8 }}>
      <TextInput id={`create-${columnId}`} value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Issue title..." size="sm" onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }} autoFocus />
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const [board, setBoard] = useState<BoardData | null>(null);
  const [projectKey, setProjectKey] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/boards/${boardId}`);
    const json = await res.json();
    setBoard(json.data);
    const projRes = await fetch(`/api/v1/projects`);
    const projJson = await projRes.json();
    const proj = projJson.data?.find((p: { id: string }) => p.id === json.data?.projectId);
    if (proj) setProjectKey(proj.key);
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const issueId = active.id as string;
    let targetColumnId: string | null = null;

    for (const col of board.columns) {
      if (col.issues.some((i) => i.id === issueId)) targetColumnId = col.id;
      if (col.id === over.id) targetColumnId = col.id;
      for (const iss of col.issues) {
        if (iss.id === over.id) targetColumnId = col.id;
      }
    }

    if (targetColumnId) {
      await fetch(`/api/v1/issues/${issueId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumnId, position: 0 }),
      });
      load();
    }
  };

  if (!board) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: "16px 0" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
        <BreadcrumbItem>{board.name}</BreadcrumbItem>
      </Breadcrumb>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 200px)" }}>
          {board.columns.map((col) => (
            <div key={col.id} style={{ minWidth: 280, maxWidth: 320, flex: "0 0 280px", backgroundColor: "var(--cds-layer)", borderRadius: 4, padding: 12, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ fontWeight: 600 }}>{col.name} <span style={{ fontWeight: 400, color: "var(--cds-text-secondary)" }}>({col.issues.length})</span></h4>
                {col.wipLimit && <Tag size="sm" type="blue">WIP: {col.wipLimit}</Tag>}
              </div>
              <SortableContext items={col.issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div style={{ flex: 1 }}>
                  {col.issues.map((issue) => (
                    <SortableIssueCard key={issue.id} issue={issue} projectKey={projectKey} />
                  ))}
                </div>
              </SortableContext>
              <InlineCreateIssue columnId={col.id} onCreate={load} />
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
