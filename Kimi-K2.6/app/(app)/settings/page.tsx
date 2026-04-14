"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Toggle, TextInput, TextArea, Button, Loading, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, NumberInput, Dropdown, ComposedModal, ModalHeader, ModalBody, ModalFooter } from "@carbon/react";
import { ArrowUp, ArrowDown } from "@carbon/icons-react";
import { useTheme } from "@/components/shell/ThemeProvider";
import { useProjects } from "@/hooks/use-projects";
import { useLabels, useCreateLabel, useDeleteLabel } from "@/hooks/use-labels";

const colorOptions = ["gray", "blue", "green", "red", "purple", "warm-gray"];

function ColorSwatch({ color }: { color: string }) {
  const bgMap: Record<string, string> = {
    gray: "#8d8d8d",
    blue: "#0f62fe",
    green: "#24a148",
    red: "#da1e28",
    purple: "#8a3ffc",
    "warm-gray": "#565656",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 2,
        background: bgMap[color] || color,
        marginRight: 8,
        verticalAlign: "middle",
      }}
    />
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: projects, isLoading, refetch: refetchProjects } = useProjects();
  const projectId = projects?.[0]?.id || "";
  const { data: labels } = useLabels(projectId);
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("blue");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [savingProject, setSavingProject] = useState(false);
  const [savingColumns, setSavingColumns] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (projects?.[0]) {
      setProjectName(projects[0].name);
      setProjectKey(projects[0].key);
      setProjectDesc(projects[0].description || "");
    }
  }, [projects]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/v1/projects/${projectId}/boards`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || [];
        setBoards(list);
        if (list[0]) {
          fetch(`/api/v1/boards/${list[0].id}`)
            .then((r) => r.json())
            .then((bd) => setColumns(bd.data?.columns || []));
        }
      });
  }, [projectId]);

  if (isLoading) return <Loading />;

  const saveProject = async () => {
    if (!projectId) return;
    setSavingProject(true);
    await fetch(`/api/v1/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName, key: projectKey, description: projectDesc }),
    });
    setSavingProject(false);
    refetchProjects();
  };

  const saveColumns = async () => {
    setSavingColumns(true);
    await Promise.all(
      columns.map((c) =>
        fetch(`/api/v1/columns/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name, color: c.color, wipLimit: c.wipLimit ? Number(c.wipLimit) : null, position: c.position }),
        })
      )
    );
    setSavingColumns(false);
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const next = [...columns];
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= next.length) return;
    const temp = next[index];
    next[index] = next[swapWith];
    next[swapWith] = temp;
    next.forEach((c, i) => (c.position = i));
    setColumns(next);
  };

  const deleteProject = async () => {
    if (!projectId) return;
    setDeletingProject(true);
    const res = await fetch(`/api/v1/projects/${projectId}`, { method: "DELETE" });
    setDeletingProject(false);
    setIsDeleteModalOpen(false);
    if (res.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div>
      <h1 className="cds--type-productive-heading-05" style={{ marginBottom: "1.5rem" }}>
        Settings
      </h1>

      <Tabs>
        <TabList aria-label="Settings tabs">
          <Tab>Project</Tab>
          <Tab>Board</Tab>
          <Tab>Labels</Tab>
          <Tab>Theme</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div style={{ maxWidth: 600, marginTop: "1rem" }}>
              <TextInput id="project-name" labelText="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ marginBottom: "1rem" }} />
              <TextInput id="project-key" labelText="Key" value={projectKey} onChange={(e) => setProjectKey(e.target.value)} style={{ marginBottom: "1rem" }} />
              <TextArea id="project-desc" labelText="Description" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} style={{ marginBottom: "1rem" }} />
              <div style={{ display: "flex", gap: "1rem" }}>
                <Button onClick={saveProject} disabled={savingProject}>{savingProject ? "Saving..." : "Save Project"}</Button>
                <Button kind="danger" onClick={() => setIsDeleteModalOpen(true)}>Delete Project</Button>
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div style={{ maxWidth: 800, marginTop: "1rem" }}>
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>Order</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Color</TableHeader>
                    <TableHeader>WIP Limit</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {columns.map((col, idx) => (
                    <TableRow key={col.id}>
                      <TableCell>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          <Button kind="ghost" size="sm" disabled={idx === 0} onClick={() => moveColumn(idx, -1)} renderIcon={ArrowUp} iconDescription="Move up" hasIconOnly />
                          <Button kind="ghost" size="sm" disabled={idx === columns.length - 1} onClick={() => moveColumn(idx, 1)} renderIcon={ArrowDown} iconDescription="Move down" hasIconOnly />
                        </div>
                      </TableCell>
                      <TableCell>
                        <TextInput
                          id={`col-name-${col.id}`}
                          hideLabel
                          labelText=""
                          value={col.name}
                          onChange={(e) => {
                            const next = [...columns];
                            next[idx].name = e.target.value;
                            setColumns(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Dropdown
                          id={`col-color-${col.id}`}
                          items={colorOptions.map((c) => ({ id: c, label: c, text: c }))}
                          selectedItem={{ id: col.color, label: col.color, text: col.color }}
                          itemToString={(item: any) => item?.text || ""}
                          onChange={({ selectedItem }: { selectedItem: any }) => {
                            if (!selectedItem) return;
                            const next = [...columns];
                            next[idx].color = selectedItem.id;
                            setColumns(next);
                          }}
                          size="sm"
                          hideLabel
                          label=""
                          titleText=""
                          renderSelectedItem={(item: any) => (
                            <span><ColorSwatch color={item.id} />{item.id}</span>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <NumberInput
                          id={`col-wip-${col.id}`}
                          hideLabel
                          label=""
                          value={col.wipLimit ?? ""}
                          onChange={(_evt, { value }) => {
                            const next = [...columns];
                            next[idx].wipLimit = value;
                            setColumns(next);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={saveColumns} disabled={savingColumns} style={{ marginTop: "1rem" }}>
                {savingColumns ? "Saving..." : "Save Columns"}
              </Button>
            </div>
          </TabPanel>

          <TabPanel>
            <div style={{ maxWidth: 600, marginTop: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "flex-end" }}>
                <TextInput id="label-name" labelText="Label Name" value={labelName} onChange={(e) => setLabelName(e.target.value)} />
                <Dropdown
                  id="label-color"
                  items={colorOptions.map((c) => ({ id: c, label: c, text: c }))}
                  selectedItem={{ id: labelColor, label: labelColor, text: labelColor }}
                  itemToString={(item: any) => item?.text || ""}
                  onChange={({ selectedItem }: { selectedItem: any }) => {
                    if (selectedItem) setLabelColor(selectedItem.id);
                  }}
                  size="sm"
                  hideLabel
                  label=""
                  titleText=""
                  renderSelectedItem={(item: any) => (
                    <span><ColorSwatch color={item.id} />{item.id}</span>
                  )}
                />
                <Button
                  onClick={() => {
                    if (!labelName.trim()) return;
                    createLabel.mutate({ projectId, data: { name: labelName.trim(), color: labelColor } }, {
                      onSuccess: () => { setLabelName(""); setLabelColor("blue"); }
                    });
                  }}
                >
                  Add Label
                </Button>
              </div>

              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Color</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(labels || []).map((label) => (
                    <TableRow key={label.id}>
                      <TableCell>{label.name}</TableCell>
                      <TableCell><ColorSwatch color={label.color} />{label.color}</TableCell>
                      <TableCell>
                        <Button kind="danger" size="sm" onClick={() => deleteLabel.mutate(label.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabPanel>

          <TabPanel>
            <div style={{ marginTop: "1rem" }}>
              <Toggle
                id="theme-toggle"
                labelText="Dark mode"
                toggled={theme === "g90"}
                onToggle={() => setTheme(theme === "g10" ? "g90" : "g10")}
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ComposedModal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalHeader title="Delete Project" />
        <ModalBody>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button kind="danger" onClick={deleteProject} disabled={deletingProject}>Delete</Button>
        </ModalFooter>
      </ComposedModal>
    </div>
  );
}
