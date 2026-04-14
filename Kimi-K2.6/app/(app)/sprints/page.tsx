"use client";

import { useState } from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Button, Loading, ComposedModal, ModalHeader, ModalBody, ModalFooter, DatePicker, DatePickerInput, TextInput, TextArea } from "@carbon/react";
import { useSprints, useCreateSprint, useStartSprint, useCompleteSprint } from "@/hooks/use-sprints";
import { useProjects } from "@/hooks/use-projects";
import { useIssues } from "@/hooks/use-issues";
import { SprintBoard } from "@/components/sprints/SprintBoard";
import { SprintPlanning } from "@/components/sprints/SprintPlanning";
import { EmptyState } from "@/components/shared/EmptyState";

export default function SprintsPage() {
  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id || "";
  const { data: sprints, isLoading } = useSprints(projectId);
  const { data: issues } = useIssues(projectId);
  const createSprint = useCreateSprint();
  const startSprint = useStartSprint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [dates, setDates] = useState<Date[]>([]);

  if (isLoading) return <Loading />;

  const planning = sprints?.filter((s) => s.status === "planning") || [];
  const active = sprints?.filter((s) => s.status === "active") || [];
  const completed = sprints?.filter((s) => s.status === "completed") || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 className="cds--type-productive-heading-05">Sprints</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create Sprint</Button>
      </div>

      <Tabs>
        <TabList aria-label="Sprint tabs">
          <Tab>Planning ({planning.length})</Tab>
          <Tab>Active ({active.length})</Tab>
          <Tab>Completed ({completed.length})</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {planning.map((sprint) => {
              const sprintIssues = issues?.filter((i) => i.sprintId === sprint.id) || [];
              const backlogIssues = issues?.filter((i) => !i.sprintId) || [];
              return (
                <div key={sprint.id} style={{ marginBottom: "2rem" }}>
                  <SprintPlanning sprint={sprint} backlogIssues={backlogIssues} sprintIssues={sprintIssues} />
                </div>
              );
            })}
            {planning.length === 0 && <EmptyState title="No sprints in planning" subtitle="Create a sprint to get started." />}
          </TabPanel>
          <TabPanel>
            {active.map((sprint) => {
              const sprintIssues = issues?.filter((i) => i.sprintId === sprint.id) || [];
              const backlogIssues = issues?.filter((i) => !i.sprintId) || [];
              return (
                <SprintBoard
                  key={sprint.id}
                  sprint={sprint}
                  issues={sprintIssues}
                  projectId={projectId}
                  backlogIssues={backlogIssues}
                />
              );
            })}
            {active.length === 0 && <EmptyState title="No active sprints" subtitle="Start a sprint from the Planning tab." />}
          </TabPanel>
          <TabPanel>
            {completed.map((sprint) => {
              const sprintIssues = issues?.filter((i) => i.sprintId === sprint.id) || [];
              const totalPoints = sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
              return (
                <div key={sprint.id} style={{ marginBottom: "1.5rem" }}>
                  <h3 className="cds--type-productive-heading-03">{sprint.name}</h3>
                  <div style={{ color: "var(--cds-text-secondary)", marginBottom: "0.5rem" }}>{sprint.goal}</div>
                  <div>Story Points: {totalPoints}</div>
                </div>
              );
            })}
            {completed.length === 0 && <EmptyState title="No completed sprints" />}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ComposedModal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader title="Create Sprint" />
        <ModalBody>
          <TextInput id="sprint-name" labelText="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: "1rem" }} />
          <TextArea id="sprint-goal" labelText="Goal" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              createSprint.mutate({ projectId, data: { name: name.trim(), goal: goal.trim() } }, {
                onSuccess: () => {
                  setName("");
                  setGoal("");
                  setIsModalOpen(false);
                },
              });
            }}
          >
            Create
          </Button>
        </ModalFooter>
      </ComposedModal>

      <ComposedModal open={startModalOpen} onClose={() => setStartModalOpen(false)}>
        <ModalHeader title="Start Sprint" />
        <ModalBody>
          <DatePicker datePickerType="range" onChange={(range: Date[]) => setDates(range)}>
            <DatePickerInput id="start-date" labelText="Start Date" placeholder="mm/dd/yyyy" />
            <DatePickerInput id="end-date" labelText="End Date" placeholder="mm/dd/yyyy" />
          </DatePicker>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setStartModalOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!selectedSprintId || dates.length < 2) return;
              startSprint.mutate({
                sprintId: selectedSprintId,
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString(),
              }, {
                onSuccess: () => {
                  setStartModalOpen(false);
                  setSelectedSprintId(null);
                  setDates([]);
                },
              });
            }}
          >
            Start
          </Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}
