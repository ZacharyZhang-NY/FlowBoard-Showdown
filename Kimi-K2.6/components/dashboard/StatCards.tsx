"use client";

import { ClickableTile, Tag, ProgressBar } from "@carbon/react";
import type { Sprint } from "@/types";

interface StatCardsProps {
  openIssues: number;
  openIssuesTrend: "up" | "down" | "stable";
  myAssigned: number;
  overdue: number;
  activeSprint: Sprint | null;
  sprintProgress: { completed: number; total: number };
}

export function StatCards({ openIssues, openIssuesTrend, myAssigned, overdue, activeSprint, sprintProgress }: StatCardsProps) {
  const pct = sprintProgress.total > 0 ? Math.round((sprintProgress.completed / sprintProgress.total) * 100) : 0;

  const trendTag =
    openIssuesTrend === "up" ? (
      <Tag type="red">Rising</Tag>
    ) : openIssuesTrend === "down" ? (
      <Tag type="green">Improving</Tag>
    ) : (
      <Tag type="blue">Stable</Tag>
    );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
      <ClickableTile href="/issues">
        <div style={{ fontSize: "2rem", fontWeight: 600 }}>{openIssues}</div>
        <div style={{ marginTop: "0.5rem" }}>Open Issues</div>
        <div style={{ marginTop: "0.5rem" }}>{trendTag}</div>
      </ClickableTile>

      <ClickableTile href="/sprints">
        <div style={{ fontSize: "1rem", fontWeight: 600 }}>{activeSprint?.name || "No active sprint"}</div>
        <div style={{ marginTop: "0.5rem" }}>Active Sprint</div>
        {activeSprint && (
          <div style={{ marginTop: "0.5rem" }}>
            <ProgressBar value={pct} label={`${sprintProgress.completed} / ${sprintProgress.total} pts`} />
          </div>
        )}
      </ClickableTile>

      <ClickableTile href="/issues">
        <div style={{ fontSize: "2rem", fontWeight: 600 }}>{myAssigned}</div>
        <div style={{ marginTop: "0.5rem" }}>My Assigned</div>
      </ClickableTile>

      <ClickableTile href="/issues">
        <div style={{ fontSize: "2rem", fontWeight: 600 }}>{overdue}</div>
        <div style={{ marginTop: "0.5rem" }}>Overdue</div>
        {overdue > 0 && (
          <Tag type="red" style={{ marginTop: "0.5rem" }}>
            Attention
          </Tag>
        )}
      </ClickableTile>
    </div>
  );
}
