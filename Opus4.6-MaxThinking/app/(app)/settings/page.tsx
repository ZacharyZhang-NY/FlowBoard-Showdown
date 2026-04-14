"use client";

import { useState, useEffect, useContext } from "react";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
  TextArea,
  Button,
  Toggle,
  Tag,
  Tile,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
  Stack,
  NumberInput,
  Dropdown,
} from "@carbon/react";
import { Add, TrashCan } from "@carbon/icons-react";
import { useProjects } from "@/hooks/use-projects";
import { ThemeContext } from "@/lib/theme-context";
import type { Label, Column } from "@/types";
import ConfirmModal from "@/components/shared/ConfirmModal";

const LABEL_COLORS = [
  { id: "blue", text: "Blue" },
  { id: "red", text: "Red" },
  { id: "green", text: "Green" },
  { id: "purple", text: "Purple" },
  { id: "gray", text: "Gray" },
  { id: "cyan", text: "Cyan" },
  { id: "teal", text: "Teal" },
  { id: "warm-gray", text: "Warm Gray" },
];

export default function SettingsPage() {
  const { projects, refetch: refetchProjects } = useProjects();
  const project = projects[0];
  const { theme, setTheme } = useContext(ThemeContext);

  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("blue");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) return;
    setProjectName(project.name);
    setProjectKey(project.key);
    setProjectDesc(project.description || "");

    // Load labels
    fetch(`/api/v1/projects/${project.id}/labels`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setLabels(json.data);
      });

    // Load boards and columns
    fetch(`/api/v1/projects/${project.id}/boards`)
      .then((r) => r.json())
      .then(async (json) => {
        if (json.data && json.data[0]) {
          const boardRes = await fetch(`/api/v1/boards/${json.data[0].id}`);
          const boardJson = await boardRes.json();
          if (boardJson.data?.columns) {
            setColumns(boardJson.data.columns.map((c: Column & { issues?: unknown[] }) => ({
              id: c.id,
              boardId: c.boardId,
              name: c.name,
              position: c.position,
              color: c.color,
              wipLimit: c.wipLimit,
            })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, [project]);

  async function handleUpdateProject() {
    if (!project) return;
    await fetch(`/api/v1/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        key: projectKey,
        description: projectDesc,
      }),
    });
    refetchProjects();
  }

  async function handleAddLabel() {
    if (!project || !newLabelName.trim()) return;
    const res = await fetch(`/api/v1/projects/${project.id}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
    });
    const json = await res.json();
    if (json.data) {
      setLabels((prev) => [...prev, json.data]);
      setNewLabelName("");
    }
  }

  async function handleDeleteLabel(labelId: string) {
    await fetch(`/api/v1/labels/${labelId}`, { method: "DELETE" });
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
  }

  async function handleUpdateColumn(columnId: string, data: Partial<Column>) {
    await fetch(`/api/v1/columns/${columnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, ...data } : c))
    );
  }

  if (loading) return <Loading withOverlay={false} />;

  return (
    <div className="settings-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <Tabs>
        <TabList aria-label="Settings tabs">
          <Tab>Project</Tab>
          <Tab>Board Columns</Tab>
          <Tab>Labels</Tab>
          <Tab>Theme</Tab>
        </TabList>
        <TabPanels>
          {/* Project Settings */}
          <TabPanel>
            <Stack gap={6}>
              <TextInput
                id="project-name"
                labelText="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <TextInput
                id="project-key"
                labelText="Project Key"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                maxLength={6}
              />
              <TextArea
                id="project-desc"
                labelText="Description"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
              <div className="flex-row" style={{ gap: "1rem" }}>
                <Button onClick={handleUpdateProject}>Save Changes</Button>
                <Button
                  kind="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Project
                </Button>
              </div>
            </Stack>

            <ConfirmModal
              open={showDeleteConfirm}
              title="Delete Project"
              description="This will permanently delete the project and all its data. This action cannot be undone."
              confirmText="Delete"
              danger
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={async () => {
                if (!project) return;
                await fetch(`/api/v1/projects/${project.id}`, {
                  method: "DELETE",
                });
                window.location.href = "/dashboard";
              }}
            />
          </TabPanel>

          {/* Board Columns */}
          <TabPanel>
            <Stack gap={4}>
              {columns.map((col) => (
                <Tile key={col.id} style={{ padding: "1rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 120px 80px",
                      gap: "1rem",
                      alignItems: "end",
                    }}
                  >
                    <TextInput
                      id={`col-name-${col.id}`}
                      labelText="Name"
                      size="sm"
                      value={col.name}
                      onChange={(e) => {
                        setColumns((prev) =>
                          prev.map((c) =>
                            c.id === col.id
                              ? { ...c, name: e.target.value }
                              : c
                          )
                        );
                      }}
                      onBlur={() =>
                        handleUpdateColumn(col.id, { name: col.name })
                      }
                    />
                    <Dropdown
                      id={`col-color-${col.id}`}
                      titleText="Color"
                      label="Color"
                      size="sm"
                      items={LABEL_COLORS}
                      itemToString={(item: { id: string; text: string } | null) =>
                        item?.text || ""
                      }
                      selectedItem={
                        LABEL_COLORS.find((c) => c.id === col.color) ||
                        LABEL_COLORS[0]
                      }
                      onChange={({
                        selectedItem,
                      }: {
                        selectedItem: { id: string; text: string } | null;
                      }) => {
                        if (selectedItem) {
                          handleUpdateColumn(col.id, {
                            color: selectedItem.id,
                          });
                        }
                      }}
                    />
                    <NumberInput
                      id={`col-wip-${col.id}`}
                      label="WIP Limit"
                      size="sm"
                      min={0}
                      max={100}
                      value={col.wipLimit ?? 0}
                      onChange={(
                        _e: unknown,
                        { value }: { value: string | number }
                      ) => {
                        const numVal =
                          typeof value === "string" ? parseInt(value) : value;
                        handleUpdateColumn(col.id, {
                          wipLimit: numVal || null,
                        });
                      }}
                    />
                    <Tag
                      size="sm"
                      type={(col.color as "blue") || "gray"}
                    >
                      {col.color}
                    </Tag>
                  </div>
                </Tile>
              ))}
            </Stack>
          </TabPanel>

          {/* Labels */}
          <TabPanel>
            <div className="mb-3">
              <div
                className="flex-row"
                style={{ gap: "0.5rem", alignItems: "flex-end" }}
              >
                <TextInput
                  id="new-label-name"
                  labelText="Label Name"
                  size="sm"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g. documentation"
                />
                <Dropdown
                  id="new-label-color"
                  titleText="Color"
                  label="Color"
                  size="sm"
                  items={LABEL_COLORS}
                  itemToString={(item: { id: string; text: string } | null) =>
                    item?.text || ""
                  }
                  selectedItem={
                    LABEL_COLORS.find((c) => c.id === newLabelColor) ||
                    LABEL_COLORS[0]
                  }
                  onChange={({
                    selectedItem,
                  }: {
                    selectedItem: { id: string; text: string } | null;
                  }) => {
                    if (selectedItem) setNewLabelColor(selectedItem.id);
                  }}
                />
                <Button
                  size="sm"
                  renderIcon={Add}
                  onClick={handleAddLabel}
                  disabled={!newLabelName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            <Stack gap={3}>
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex-between"
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--cds-border-subtle)",
                  }}
                >
                  <Tag type={(label.color as "blue") || "blue"}>
                    {label.name}
                  </Tag>
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    iconDescription="Delete label"
                    hasIconOnly
                    onClick={() => handleDeleteLabel(label.id)}
                  />
                </div>
              ))}
            </Stack>
          </TabPanel>

          {/* Theme */}
          <TabPanel>
            <Toggle
              id="theme-toggle"
              labelText="Dark Mode"
              labelA="Light (Gray 10)"
              labelB="Dark (Gray 90)"
              toggled={theme === "g90"}
              onToggle={(toggled) => setTheme(toggled ? "g90" : "g10")}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
