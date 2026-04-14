"use client";

import { useState } from "react";
import {
  Button,
  ComposedModal,
  Dropdown,
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
  Toggle,
} from "@carbon/react";

import { labelColorOptions } from "@/src/shared/constants/labels";
import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import {
  useBoardSuspense,
  useBoardsSuspense,
  useCreateColumnMutation,
  useDeleteColumnMutation,
  useReorderColumnsMutation,
  useUpdateBoardMutation,
  useUpdateColumnMutation,
} from "@/src/state/query/useBoards";
import { useCurrentProjectSuspense } from "@/src/state/query/useProjects";
import {
  useCreateLabelMutation,
  useDeleteLabelMutation,
  useDeleteProjectMutation,
  useLabelsSuspense,
  useUpdateProjectMutation,
} from "@/src/state/query/useSettings";
import { useUiStore } from "@/src/state/stores/ui-store";

type CurrentProject = NonNullable<ReturnType<typeof useCurrentProjectSuspense>["currentProject"]>;
type LabelColor = (typeof labelColorOptions)[number];

type BoardSettingsPanelProps = {
  activeBoardId: string;
  boards: Array<{ id: string; name: string }>;
  projectId: string;
  selectedBoardId: string | null;
  setSelectedBoardId: (value: string | null) => void;
};

function BoardSettingsPanel({
  activeBoardId,
  boards,
  projectId,
  selectedBoardId,
  setSelectedBoardId,
}: BoardSettingsPanelProps) {
  const [newColumnName, setNewColumnName] = useState("");
  const { data: board } = useBoardSuspense(activeBoardId, {});
  const updateBoardMutation = useUpdateBoardMutation(board.id, projectId);
  const createColumnMutation = useCreateColumnMutation(board.id);
  const updateColumnMutation = useUpdateColumnMutation(board.id);
  const deleteColumnMutation = useDeleteColumnMutation(board.id);
  const reorderColumnsMutation = useReorderColumnsMutation(board.id);

  return (
    <div className="flowboard-stack">
      <Tile className="flowboard-panel flowboard-stack">
        <Dropdown
          id="settings-board-select"
          itemToString={(item) => item?.label ?? ""}
          items={boards.map((entry) => ({ id: entry.id, label: entry.name }))}
          label="Board"
          onChange={({ selectedItem }) => {
            setSelectedBoardId(selectedItem?.id ?? null);
          }}
          selectedItem={
            boards
              .map((entry) => ({ id: entry.id, label: entry.name }))
              .find((entry) => entry.id === (selectedBoardId ?? activeBoardId)) ?? null
          }
          titleText="Board"
        />
        <TextInput
          id="board-name"
          labelText="Board name"
          onBlur={async (event) => {
            await updateBoardMutation.mutateAsync({ name: event.target.value });
          }}
          defaultValue={board.name}
        />
      </Tile>
      <Tile className="flowboard-panel">
        <div className="flowboard-panel__header">
          <h2>Columns</h2>
        </div>
        <StructuredListWrapper>
          <StructuredListBody>
            {board.columns.map((column, index) => (
              <StructuredListRow key={column.id}>
                <StructuredListCell>{column.name}</StructuredListCell>
                <StructuredListCell>{column.color}</StructuredListCell>
                <StructuredListCell>{column.wipLimit ?? "-"}</StructuredListCell>
                <StructuredListCell>
                  <div className="flowboard-inline-actions">
                    <Button
                      kind="ghost"
                      onClick={async () => {
                        if (index === 0) {
                          return;
                        }

                        const nextIds = [...board.columns.map((entry) => entry.id)];
                        const previousId = nextIds[index - 1];
                        const currentId = nextIds[index];

                        if (!previousId || !currentId) {
                          return;
                        }

                        nextIds[index - 1] = currentId;
                        nextIds[index] = previousId;
                        await reorderColumnsMutation.mutateAsync(nextIds);
                      }}
                      size="sm"
                    >
                      Up
                    </Button>
                    <Button
                      kind="ghost"
                      onClick={async () => {
                        await updateColumnMutation.mutateAsync({
                          columnId: column.id,
                          payload: {
                            wipLimit: column.wipLimit ? null : 5,
                          },
                        });
                      }}
                      size="sm"
                    >
                      Toggle WIP
                    </Button>
                    <Button
                      kind="ghost"
                      onClick={async () => {
                        await deleteColumnMutation.mutateAsync(column.id);
                      }}
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </StructuredListCell>
              </StructuredListRow>
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
        <div className="flowboard-inline-form">
          <TextInput
            id="new-column-name"
            labelText="New column"
            onChange={(event) => setNewColumnName(event.target.value)}
            value={newColumnName}
          />
          <Button
            onClick={async () => {
              if (!newColumnName.trim()) {
                return;
              }

              await createColumnMutation.mutateAsync({
                color: "gray",
                name: newColumnName.trim(),
                wipLimit: null,
              });
              setNewColumnName("");
            }}
          >
            Add column
          </Button>
        </div>
      </Tile>
    </div>
  );
}

export function SettingsScreen() {
  const { currentProject } = useCurrentProjectSuspense();

  if (!currentProject) {
    return null;
  }

  return <SettingsScreenContent currentProject={currentProject} />;
}

function SettingsScreenContent({ currentProject }: { currentProject: CurrentProject }) {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [projectName, setProjectName] = useState(currentProject.name);
  const [projectKey, setProjectKey] = useState(currentProject.key);
  const [projectDescription, setProjectDescription] = useState(currentProject.description ?? "");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>(labelColorOptions[0]);

  const { data: boards } = useBoardsSuspense(currentProject.id);
  const { data: labels } = useLabelsSuspense(currentProject.id);
  const updateProjectMutation = useUpdateProjectMutation(currentProject.id);
  const deleteProjectMutation = useDeleteProjectMutation();
  const createLabelMutation = useCreateLabelMutation(currentProject.id);
  const deleteLabelMutation = useDeleteLabelMutation(currentProject.id);
  const activeBoardId = selectedBoardId ?? boards[0]?.id ?? null;

  return (
    <PageLayout
      description="Project administration, board structure and display settings."
      title="Settings"
    >
      <Tabs>
        <TabList aria-label="Settings sections" contained>
          <Tab>Project</Tab>
          <Tab>Board</Tab>
          <Tab>Labels</Tab>
          <Tab>Theme</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Tile className="flowboard-panel flowboard-stack">
              <TextInput
                id="project-name"
                labelText="Project name"
                onChange={(event) => setProjectName(event.target.value)}
                value={projectName}
              />
              <TextInput
                id="project-key"
                labelText="Project key"
                onChange={(event) => setProjectKey(event.target.value.toUpperCase())}
                value={projectKey}
              />
              <TextArea
                id="project-description"
                labelText="Description"
                onChange={(event) => setProjectDescription(event.target.value)}
                rows={5}
                value={projectDescription}
              />
              <div className="flowboard-inline-actions">
                <Button
                  onClick={async () => {
                    await updateProjectMutation.mutateAsync({
                      description: projectDescription || null,
                      key: projectKey,
                      name: projectName,
                    });
                  }}
                >
                  Save project
                </Button>
                <Button kind="danger" onClick={() => setDeleteOpen(true)}>
                  Delete project
                </Button>
              </div>
            </Tile>
          </TabPanel>
          <TabPanel>
            {activeBoardId ? (
              <BoardSettingsPanel
                activeBoardId={activeBoardId}
                boards={boards}
                projectId={currentProject.id}
                selectedBoardId={selectedBoardId}
                setSelectedBoardId={setSelectedBoardId}
              />
            ) : (
              <Tile className="flowboard-panel">
                <p>No boards available for this project.</p>
              </Tile>
            )}
          </TabPanel>
          <TabPanel>
            <Tile className="flowboard-panel flowboard-stack">
              <div className="flowboard-inline-form">
                <TextInput
                  id="new-label-name"
                  labelText="Label name"
                  onChange={(event) => setNewLabelName(event.target.value)}
                  value={newLabelName}
                />
                <Dropdown
                  id="new-label-color"
                  itemToString={(item) => item?.label ?? ""}
                  items={labelColorOptions.map((color) => ({ id: color, label: color }))}
                  label="Color"
                  onChange={({ selectedItem }) => {
                    setNewLabelColor((selectedItem?.id as LabelColor | undefined) ?? labelColorOptions[0]);
                  }}
                  selectedItem={{ id: newLabelColor, label: newLabelColor }}
                  titleText="Color"
                />
                <Button
                  onClick={async () => {
                    if (!newLabelName.trim()) {
                      return;
                    }

                    await createLabelMutation.mutateAsync({
                      color: newLabelColor,
                      name: newLabelName.trim(),
                    });
                    setNewLabelName("");
                  }}
                >
                  Add label
                </Button>
              </div>
              <StructuredListWrapper>
                <StructuredListBody>
                  {labels.items.map((label) => (
                    <StructuredListRow key={label.id}>
                      <StructuredListCell>{label.name}</StructuredListCell>
                      <StructuredListCell>{label.color}</StructuredListCell>
                      <StructuredListCell>
                        <Button
                          kind="ghost"
                          onClick={async () => {
                            await deleteLabelMutation.mutateAsync(label.id);
                          }}
                          size="sm"
                        >
                          Delete
                        </Button>
                      </StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            </Tile>
          </TabPanel>
          <TabPanel>
            <Tile className="flowboard-panel flowboard-stack">
              <Toggle
                id="theme-toggle"
                labelA="Gray 10"
                labelB="Gray 90"
                labelText="Theme"
                onToggle={(checked) => {
                  setTheme(checked ? "g90" : "g10");
                }}
                toggled={theme === "g90"}
              />
            </Tile>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ComposedModal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <ModalHeader label="Project" title="Delete project" />
        <ModalBody>
          <p>This removes the current project and its data.</p>
        </ModalBody>
        <ModalFooter
          danger
          primaryButtonText="Delete"
          secondaryButtonText="Cancel"
          onRequestClose={() => setDeleteOpen(false)}
          onRequestSubmit={async () => {
            await deleteProjectMutation.mutateAsync(currentProject.id);
            setDeleteOpen(false);
          }}
        >
          {null}
        </ModalFooter>
      </ComposedModal>
    </PageLayout>
  );
}
