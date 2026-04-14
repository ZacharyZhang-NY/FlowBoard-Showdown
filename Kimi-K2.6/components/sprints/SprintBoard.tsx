"use client";

import { useMemo, useState } from "react";
import {
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Loading,
  ProgressBar,
} from "@carbon/react";
import { LineChart } from "@carbon/charts-react";
import type { Issue, Sprint } from "@/types";
import { useBurndown, useCompleteSprint } from "@/hooks/use-sprints";

interface SprintBoardProps {
  sprint: Sprint;
  issues: Issue[];
  projectId: string;
  backlogIssues: Issue[];
}

export function SprintBoard({ sprint, issues, projectId }: SprintBoardProps) {
  const { data: burndown } = useBurndown(projectId);
  const completeSprint = useCompleteSprint();
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedMoveIds, setSelectedMoveIds] = useState<string[]>([]);

  const grouped = useMemo(() => {
    const groups: Record<string, Issue[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };
    issues.forEach((i) => {
      if (groups[i.status]) groups[i.status].push(i);
      else groups.todo.push(i);
    });
    return groups;
  }, [issues]);

  const incompleteIssues = useMemo(() => issues.filter((i) => i.status !== "done"), [issues]);

  const chartData = useMemo(() => {
    if (!burndown) return [];
    return burndown.dates.map((date, idx) => ({
      group: "Ideal",
      date,
      value: burndown.ideal[idx],
    })).concat(
      burndown.dates.map((date, idx) => ({
        group: "Actual",
        date,
        value: burndown.actual[idx],
      }))
    );
  }, [burndown]);

  const elapsedPct = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return 0;
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [sprint]);

  const handleComplete = () => {
    completeSprint.mutate(
      { sprintId: sprint.id, moveToBacklogIssueIds: selectedMoveIds },
      { onSuccess: () => { setCompleteModalOpen(false); setSelectedMoveIds([]); } }
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 className="cds--type-productive-heading-03">{sprint.name}</h3>
          {sprint.goal && <div style={{ color: "var(--cds-text-secondary)" }}>{sprint.goal}</div>}
          {sprint.startDate && sprint.endDate && (
            <div style={{ marginTop: "0.5rem", maxWidth: 400 }}>
              <div style={{ fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--cds-text-secondary)" }}>
                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()} ({elapsedPct}% elapsed)
              </div>
              <ProgressBar value={elapsedPct} label="Time elapsed" />
            </div>
          )}
        </div>
        {sprint.status === "active" && (
          <Button kind="danger" size="sm" onClick={() => setCompleteModalOpen(true)}>Complete Sprint</Button>
        )}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Sprint Issues</div>
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Status</StructuredListCell>
              <StructuredListCell head>Issue</StructuredListCell>
              <StructuredListCell head>Points</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {Object.entries(grouped).map(([status, list]) =>
              list.map((issue) => (
                <StructuredListRow key={issue.id}>
                  <StructuredListCell>{status.replace("_", " ")}</StructuredListCell>
                  <StructuredListCell>{issue.title}</StructuredListCell>
                  <StructuredListCell>{issue.storyPoints ?? "-"}</StructuredListCell>
                </StructuredListRow>
              ))
            )}
            {issues.length === 0 && (
              <StructuredListRow>
                <StructuredListCell>No issues in this sprint</StructuredListCell>
                <StructuredListCell />
                <StructuredListCell />
              </StructuredListRow>
            )}
          </StructuredListBody>
        </StructuredListWrapper>
      </div>

      {sprint.status === "active" && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Burndown</div>
          {burndown ? (
            <LineChart
              data={chartData}
              options={{
                title: "",
                axes: {
                  bottom: { title: "Date", mapsTo: "date", scaleType: "labels" as any },
                  left: { title: "Story Points", mapsTo: "value", scaleType: "linear" as any },
                },
                curve: "curveMonotoneX",
                height: "300px",
                legend: { enabled: true },
                color: { scale: { Ideal: "#0f62fe", Actual: "#fa4d56" } },
              } as any}
            />
          ) : (
            <Loading description="Loading burndown chart" withOverlay={false} />
          )}
        </div>
      )}

      <ComposedModal open={completeModalOpen} onClose={() => { setCompleteModalOpen(false); setSelectedMoveIds([]); }}>
        <ModalHeader title="Complete Sprint" />
        <ModalBody>
          <p style={{ marginBottom: "1rem" }}>Select incomplete issues to move back to the backlog.</p>
          {incompleteIssues.map((issue) => (
            <Checkbox
              key={issue.id}
              id={`move-${issue.id}`}
              labelText={`${issue.title} (${issue.storyPoints ?? 0} pts)`}
              checked={selectedMoveIds.includes(issue.id)}
              onChange={(_: any, { checked }: { checked: boolean }) => {
                setSelectedMoveIds((prev) =>
                  checked ? [...prev, issue.id] : prev.filter((id) => id !== issue.id)
                );
              }}
            />
          ))}
          {incompleteIssues.length === 0 && <p>All issues are done. No items to move.</p>}
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => { setCompleteModalOpen(false); setSelectedMoveIds([]); }}>Cancel</Button>
          <Button onClick={handleComplete}>Complete Sprint</Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}
