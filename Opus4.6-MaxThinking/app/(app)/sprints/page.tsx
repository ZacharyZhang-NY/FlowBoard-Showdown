"use client";

import { useState, useEffect } from "react";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tile,
  Tag,
  Button,
  ProgressBar,
  Loading,
  StructuredListWrapper,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  TextArea,
  DatePicker,
  DatePickerInput,
  Stack,
} from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { useSprints } from "@/hooks/use-sprints";
import { useProjects } from "@/hooks/use-projects";
import type { Sprint, IssueWithRelations } from "@/types";
import { STATUS_TAG_KIND, STATUS_LABELS, PRIORITY_TAG_KIND, PRIORITY_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import { Timer as SprintIcon } from "@carbon/icons-react";

export default function SprintsPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const projectId = projects[0]?.id || null;
  const { sprints, loading, refetch } = useSprints(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprintIssues, setSprintIssues] = useState<Record<string, IssueWithRelations[]>>({});
  const [createName, setCreateName] = useState("");
  const [createGoal, setCreateGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const planning = sprints.filter((s) => s.status === "planning");
  const active = sprints.filter((s) => s.status === "active");
  const completed = sprints.filter((s) => s.status === "completed");

  useEffect(() => {
    if (!projectId) return;
    // Load issues for each sprint
    sprints.forEach(async (sprint) => {
      const res = await fetch(
        `/api/v1/projects/${projectId}/issues?sprintId=${sprint.id}&limit=200`
      );
      const json = await res.json();
      if (json.data) {
        setSprintIssues((prev) => ({
          ...prev,
          [sprint.id]: json.data.issues,
        }));
      }
    });
  }, [projectId, sprints]);

  async function handleCreateSprint() {
    if (!projectId || !createName.trim()) return;
    await fetch(`/api/v1/projects/${projectId}/sprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName.trim(), goal: createGoal.trim() || undefined }),
    });
    setShowCreateModal(false);
    setCreateName("");
    setCreateGoal("");
    refetch();
  }

  async function handleStartSprint() {
    if (!selectedSprint || !startDate || !endDate) return;
    await fetch(`/api/v1/sprints/${selectedSprint.id}/start`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
    setShowStartModal(false);
    setSelectedSprint(null);
    refetch();
  }

  async function handleCompleteSprint(sprintId: string) {
    await fetch(`/api/v1/sprints/${sprintId}/complete`, { method: "PUT" });
    refetch();
  }

  function renderSprintCard(sprint: Sprint) {
    const issues = sprintIssues[sprint.id] || [];
    const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);
    const donePoints = issues
      .filter((i) => i.status === "done")
      .reduce((s, i) => s + (i.storyPoints || 0), 0);
    const progress = totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0;

    const now = new Date();
    const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
    const sprintEnd = sprint.endDate ? new Date(sprint.endDate) : null;
    const totalDays = sprintStart && sprintEnd ? differenceInDays(sprintEnd, sprintStart) : 0;
    const elapsedDays = sprintStart ? Math.max(0, differenceInDays(now, sprintStart)) : 0;
    const timeProgress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

    return (
      <Tile key={sprint.id} style={{ marginBottom: "1rem", padding: "1.25rem" }}>
        <div className="sprint-header">
          <div>
            <h3 className="section-title" style={{ marginBottom: "0.25rem" }}>
              {sprint.name}
            </h3>
            {sprint.goal && (
              <p style={{ color: "var(--cds-text-secondary)", marginBottom: "0.5rem" }}>
                {sprint.goal}
              </p>
            )}
          </div>
          <div className="flex-row">
            <Tag type={sprint.status === "active" ? "blue" : sprint.status === "completed" ? "green" : "gray"}>
              {sprint.status}
            </Tag>
            {sprint.status === "planning" && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setShowStartModal(true);
                }}
              >
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button
                size="sm"
                kind="danger--ghost"
                onClick={() => handleCompleteSprint(sprint.id)}
              >
                Complete Sprint
              </Button>
            )}
          </div>
        </div>

        {sprint.startDate && sprint.endDate && (
          <div className="sprint-meta mb-2">
            <span>{formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</span>
          </div>
        )}

        {sprint.status === "active" && (
          <div className="mb-2">
            <ProgressBar
              label={`${donePoints}/${totalPoints} story points`}
              value={progress}
              size="small"
            />
            <div style={{ marginTop: "0.5rem" }}>
              <ProgressBar
                label={`Time: ${elapsedDays}/${totalDays} days`}
                value={timeProgress}
                size="small"
              />
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <StructuredListWrapper isCondensed>
            <StructuredListBody>
              {issues.map((issue) => (
                <StructuredListRow key={issue.id}>
                  <StructuredListCell style={{ width: "60px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      FB-{issue.number}
                    </span>
                  </StructuredListCell>
                  <StructuredListCell>{issue.title}</StructuredListCell>
                  <StructuredListCell>
                    <Tag size="sm" type={STATUS_TAG_KIND[issue.status as keyof typeof STATUS_TAG_KIND] || "gray"}>
                      {STATUS_LABELS[issue.status as keyof typeof STATUS_LABELS]}
                    </Tag>
                  </StructuredListCell>
                  <StructuredListCell>
                    <Tag size="sm" type={PRIORITY_TAG_KIND[issue.priority as keyof typeof PRIORITY_TAG_KIND] || "gray"}>
                      {PRIORITY_LABELS[issue.priority as keyof typeof PRIORITY_LABELS]}
                    </Tag>
                  </StructuredListCell>
                  <StructuredListCell>
                    {issue.storyPoints ?? "—"}
                  </StructuredListCell>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        )}
      </Tile>
    );
  }

  if (projectsLoading || loading) {
    return <Loading withOverlay={false} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sprints</h1>
        <Button renderIcon={Add} onClick={() => setShowCreateModal(true)}>
          New Sprint
        </Button>
      </div>

      <Tabs>
        <TabList aria-label="Sprint tabs">
          <Tab>Active ({active.length})</Tab>
          <Tab>Planning ({planning.length})</Tab>
          <Tab>Completed ({completed.length})</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {active.length > 0 ? (
              active.map(renderSprintCard)
            ) : (
              <EmptyState
                icon={<SprintIcon size={48} />}
                title="No active sprints"
                description="Start a sprint from the Planning tab."
              />
            )}
          </TabPanel>
          <TabPanel>
            {planning.length > 0 ? (
              planning.map(renderSprintCard)
            ) : (
              <EmptyState
                icon={<SprintIcon size={48} />}
                title="No sprints in planning"
                description="Create a new sprint to get started."
              />
            )}
          </TabPanel>
          <TabPanel>
            {completed.length > 0 ? (
              completed.map(renderSprintCard)
            ) : (
              <EmptyState
                icon={<SprintIcon size={48} />}
                title="No completed sprints"
                description="Completed sprints will appear here."
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Sprint Modal */}
      <ComposedModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="sm"
      >
        <ModalHeader title="Create Sprint" />
        <ModalBody>
          <Stack gap={6}>
            <TextInput
              id="sprint-name"
              labelText="Sprint Name"
              placeholder="Sprint 2"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
            <TextArea
              id="sprint-goal"
              labelText="Goal"
              placeholder="What should this sprint accomplish?"
              value={createGoal}
              onChange={(e) => setCreateGoal(e.target.value)}
            />
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSprint} disabled={!createName.trim()}>
            Create
          </Button>
        </ModalFooter>
      </ComposedModal>

      {/* Start Sprint Modal */}
      <ComposedModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        size="sm"
      >
        <ModalHeader title="Start Sprint" />
        <ModalBody>
          <Stack gap={6}>
            <DatePicker
              datePickerType="single"
              onChange={([date]: Date[]) => {
                if (date) setStartDate(date.toISOString());
              }}
            >
              <DatePickerInput
                id="sprint-start"
                placeholder="mm/dd/yyyy"
                labelText="Start Date"
              />
            </DatePicker>
            <DatePicker
              datePickerType="single"
              onChange={([date]: Date[]) => {
                if (date) setEndDate(date.toISOString());
              }}
            >
              <DatePickerInput
                id="sprint-end"
                placeholder="mm/dd/yyyy"
                labelText="End Date"
              />
            </DatePicker>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setShowStartModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStartSprint}
            disabled={!startDate || !endDate}
          >
            Start
          </Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}
