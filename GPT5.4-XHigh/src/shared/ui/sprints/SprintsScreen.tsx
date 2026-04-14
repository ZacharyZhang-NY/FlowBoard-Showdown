"use client";

import { useState } from "react";
import { ScaleTypes } from "@carbon/charts";
import { LineChart } from "@carbon/charts-react";
import {
  Button,
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  TextArea,
  TextInput,
  Tile,
} from "@carbon/react";

import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { StatusTag } from "@/src/shared/ui/app/Tags";
import { useIssuesSuspense } from "@/src/state/query/useIssues";
import { useCurrentProjectSuspense } from "@/src/state/query/useProjects";
import {
  useAssignIssueToSprintMutation,
  useCompleteSprintMutation,
  useCreateSprintMutation,
  useSprintsSuspense,
  useStartSprintMutation,
} from "@/src/state/query/useSprints";
import { useBurndownSuspense } from "@/src/state/query/useReports";

type CurrentProject = NonNullable<ReturnType<typeof useCurrentProjectSuspense>["currentProject"]>;

export function SprintsScreen() {
  const { currentProject } = useCurrentProjectSuspense();

  if (!currentProject) {
    return null;
  }

  return <SprintsScreenContent currentProject={currentProject} />;
}

function SprintsScreenContent({ currentProject }: { currentProject: CurrentProject }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: sprints } = useSprintsSuspense(currentProject.id);
  const { data: backlogIssues } = useIssuesSuspense(currentProject.id, {
    page: 1,
    pageSize: 100,
    sortBy: "updatedAt",
    sortDirection: "desc",
  });
  const { data: burndown } = useBurndownSuspense(currentProject.id);
  const createSprintMutation = useCreateSprintMutation(currentProject.id);
  const startSprintMutation = useStartSprintMutation(currentProject.id);
  const completeSprintMutation = useCompleteSprintMutation(currentProject.id);
  const assignIssueMutation = useAssignIssueToSprintMutation(currentProject.id);

  const planningSprints = sprints.items.filter((sprint) => sprint.status === "planning");
  const activeSprint = sprints.items.find((sprint) => sprint.status === "active") ?? null;
  const completedSprints = sprints.items.filter((sprint) => sprint.status === "completed");
  const planningSprint = planningSprints[0] ?? null;
  const backlog = backlogIssues.items.filter((issue) => !issue.sprintId && issue.status !== "done");

  const activeSummary = activeSprint ? (
    <div className="flowboard-stack">
      <Tile className="flowboard-panel">
        <div className="flowboard-panel__header">
          <h2>{activeSprint.name}</h2>
          <Button kind="secondary" onClick={() => setCompleteOpen(true)}>
            Complete sprint
          </Button>
        </div>
        <p>{activeSprint.goal}</p>
        <StructuredListWrapper>
          <StructuredListBody>
            {Object.entries(activeSprint.issuesByStatus).map(([status, issues]) => (
              <StructuredListRow key={status}>
                <StructuredListCell>
                  <div className="flowboard-flex flowboard-flex--between">
                    <StatusTag status={status as Parameters<typeof StatusTag>[0]["status"]} />
                    <span>{issues.length}</span>
                  </div>
                </StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </Tile>
      <Tile className="flowboard-panel">
        <div className="flowboard-panel__header">
          <h2>Burndown</h2>
        </div>
        <LineChart
          data={[
            ...burndown.ideal.map((point) => ({
              date: point.date,
              group: "Ideal",
              value: point.value,
            })),
            ...burndown.actual.map((point) => ({
              date: point.date,
              group: "Actual",
              value: point.value,
            })),
          ]}
          options={{
            axes: {
              left: { mapsTo: "value", title: "Story points" },
              bottom: { mapsTo: "date", scaleType: ScaleTypes.TIME },
            },
            height: "320px",
          }}
        />
      </Tile>
    </div>
  ) : (
    <Tile className="flowboard-panel">
      <p>No active sprint.</p>
    </Tile>
  );

  const planningSummary = (
    <div className="flowboard-stack">
      <Tile className="flowboard-panel">
        <div className="flowboard-panel__header">
          <h2>{planningSprint?.name ?? "Planning sprint"}</h2>
          <div className="flowboard-inline-actions">
            <Button kind="secondary" onClick={() => setCreateOpen(true)}>
              Create sprint
            </Button>
            {planningSprint ? (
              <Button onClick={() => setStartOpen(true)}>Start sprint</Button>
            ) : null}
          </div>
        </div>
        <p>{planningSprint?.goal ?? "Backlog selection for the next sprint."}</p>
        <div className="flowboard-sprint-grid">
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h3>Backlog</h3>
            </div>
            <StructuredListWrapper>
              <StructuredListBody>
                {backlog.map((issue) => (
                  <StructuredListRow key={issue.id}>
                    <StructuredListCell>{issue.key}</StructuredListCell>
                    <StructuredListCell>{issue.title}</StructuredListCell>
                    <StructuredListCell>
                      {planningSprint ? (
                        <Button
                          kind="ghost"
                          onClick={async () => {
                            await assignIssueMutation.mutateAsync({
                              issueId: issue.id,
                              payload: {
                                sprintId: planningSprint.id,
                                version: issue.version,
                              },
                            });
                          }}
                          size="sm"
                        >
                          Add
                        </Button>
                      ) : null}
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h3>Selected issues</h3>
            </div>
            <StructuredListWrapper>
              <StructuredListBody>
                {(planningSprint
                  ? [
                      ...planningSprint.issuesByStatus.todo,
                      ...planningSprint.issuesByStatus.in_progress,
                      ...planningSprint.issuesByStatus.in_review,
                      ...planningSprint.issuesByStatus.done,
                      ...planningSprint.issuesByStatus.blocked,
                    ]
                  : []
                ).map((issue) => (
                  <StructuredListRow key={issue.id}>
                    <StructuredListCell>{issue.key}</StructuredListCell>
                    <StructuredListCell>{issue.title}</StructuredListCell>
                    <StructuredListCell>
                      <Button
                        kind="ghost"
                        onClick={async () => {
                          await assignIssueMutation.mutateAsync({
                            issueId: issue.id,
                            payload: {
                              sprintId: null,
                              version: issue.version,
                            },
                          });
                        }}
                        size="sm"
                      >
                        Remove
                      </Button>
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
        </div>
      </Tile>
    </div>
  );

  return (
    <PageLayout description="Plan, start and complete iterations." title="Sprints">
      <Tabs>
        <TabList aria-label="Sprint states" contained>
          <Tab>Planning</Tab>
          <Tab>Active</Tab>
          <Tab>Completed</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>{planningSummary}</TabPanel>
          <TabPanel>{activeSummary}</TabPanel>
          <TabPanel>
            <Tile className="flowboard-panel">
              <StructuredListWrapper>
                <StructuredListBody>
                  {completedSprints.map((sprint) => (
                    <StructuredListRow key={sprint.id}>
                      <StructuredListCell>{sprint.name}</StructuredListCell>
                      <StructuredListCell>{sprint.completedStoryPoints} pts done</StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            </Tile>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ComposedModal open={createOpen} onClose={() => setCreateOpen(false)}>
        <ModalHeader label="Sprint" title="Create sprint" />
        <ModalBody className="flowboard-modal-body">
          <TextInput
            id="sprint-name"
            labelText="Name"
            onChange={(event) => setDraftName(event.target.value)}
            value={draftName}
          />
          <TextArea
            id="sprint-goal"
            labelText="Goal"
            onChange={(event) => setDraftGoal(event.target.value)}
            value={draftGoal}
          />
        </ModalBody>
        <ModalFooter
          primaryButtonText="Create"
          secondaryButtonText="Cancel"
          onRequestClose={() => setCreateOpen(false)}
          onRequestSubmit={async () => {
            await createSprintMutation.mutateAsync({
              goal: draftGoal || null,
              name: draftName,
            });
            setDraftName("");
            setDraftGoal("");
            setCreateOpen(false);
          }}
        >
          {null}
        </ModalFooter>
      </ComposedModal>

      {planningSprint ? (
        <ComposedModal open={startOpen} onClose={() => setStartOpen(false)}>
          <ModalHeader label="Sprint" title="Start sprint" />
          <ModalBody className="flowboard-modal-body">
            <TextInput
              id="sprint-start-date"
              labelText="Start date"
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
            <TextInput
              id="sprint-end-date"
              labelText="End date"
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </ModalBody>
          <ModalFooter
            primaryButtonText="Start"
            secondaryButtonText="Cancel"
            onRequestClose={() => setStartOpen(false)}
            onRequestSubmit={async () => {
              await startSprintMutation.mutateAsync({
                endDate: new Date(`${endDate}T00:00:00.000Z`).toISOString(),
                sprintId: planningSprint.id,
                startDate: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
              });
              setStartDate("");
              setEndDate("");
              setStartOpen(false);
            }}
          >
            {null}
          </ModalFooter>
        </ComposedModal>
      ) : null}

      {activeSprint ? (
        <ComposedModal open={completeOpen} onClose={() => setCompleteOpen(false)}>
          <ModalHeader label="Sprint" title="Complete sprint" />
          <ModalBody>
            <p>Incomplete issues return to backlog after completion.</p>
          </ModalBody>
          <ModalFooter
            primaryButtonText="Complete"
            secondaryButtonText="Cancel"
            onRequestClose={() => setCompleteOpen(false)}
            onRequestSubmit={async () => {
              await completeSprintMutation.mutateAsync({
                moveIncompleteIssuesToBacklog: true,
                sprintId: activeSprint.id,
              });
              setCompleteOpen(false);
            }}
          >
            {null}
          </ModalFooter>
        </ComposedModal>
      ) : null}
    </PageLayout>
  );
}
