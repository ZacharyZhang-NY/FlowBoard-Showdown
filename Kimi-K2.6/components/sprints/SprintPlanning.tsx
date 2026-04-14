"use client";

import { useMemo, useState } from "react";
import { Tile, Button, Checkbox } from "@carbon/react";
import type { Issue, Sprint } from "@/types";
import { useUpdateIssue } from "@/hooks/use-issues";

interface SprintPlanningProps {
  sprint: Sprint;
  backlogIssues: Issue[];
  sprintIssues: Issue[];
}

export function SprintPlanning({ sprint, backlogIssues, sprintIssues }: SprintPlanningProps) {
  const updateIssue = useUpdateIssue();
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<string[]>([]);

  const totalPoints = useMemo(
    () => sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
    [sprintIssues]
  );

  const toggleBacklog = (id: string) => {
    setSelectedBacklogIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addToSprint = () => {
    selectedBacklogIds.forEach((id) => {
      updateIssue.mutate({ id, data: { sprintId: sprint.id } });
    });
    setSelectedBacklogIds([]);
  };

  const removeFromSprint = (id: string) => {
    updateIssue.mutate({ id, data: { sprintId: null } });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      <Tile>
        <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Backlog</div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {backlogIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--cds-border-subtle)",
              }}
            >
              <Checkbox
                id={`bl-${issue.id}`}
                labelText=""
                hideLabel
                checked={selectedBacklogIds.includes(issue.id)}
                onChange={(_: any, { checked }: { checked: boolean }) => {
                  toggleBacklog(issue.id);
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem" }}>{issue.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                  {issue.storyPoints ?? 0} pts · {issue.priority} · {issue.type}
                </div>
              </div>
            </div>
          ))}
          {backlogIssues.length === 0 && (
            <div style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>No backlog issues</div>
          )}
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <Button size="sm" onClick={addToSprint} disabled={selectedBacklogIds.length === 0}>
            Add to Sprint
          </Button>
        </div>
      </Tile>

      <Tile>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ fontWeight: 600 }}>Sprint: {sprint.name}</div>
          <div style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>{totalPoints} pts</div>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {sprintIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--cds-border-subtle)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem" }}>{issue.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                  {issue.storyPoints ?? 0} pts · {issue.priority} · {issue.type}
                </div>
              </div>
              <Button kind="ghost" size="sm" onClick={() => removeFromSprint(issue.id)}>
                Remove
              </Button>
            </div>
          ))}
          {sprintIssues.length === 0 && (
            <div style={{ color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>No issues planned</div>
          )}
        </div>
      </Tile>
    </div>
  );
}
