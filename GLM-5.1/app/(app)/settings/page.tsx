"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, TextInput, Button, Toggle, Tag, DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, ComposedModal, ModalHeader, ModalBody, ModalFooter, Dropdown } from "@carbon/react";
import { useTheme } from "@/components/shell/ThemeProvider";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [project, setProject] = useState<any>(null);
  const [projectLabels, setProjectLabels] = useState<any[]>([]);
  const [boardColumns, setBoardColumns] = useState<any[]>([]);
  const [boardId, setBoardId] = useState("");
  const [labelModal, setLabelModal] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("blue");

  const load = useCallback(async () => {
    const projRes = await fetch("/api/v1/projects");
    const proj = (await projRes.json()).data?.[0];
    if (!proj) return;
    setProject(proj);
    const [lRes, bRes] = await Promise.all([fetch(`/api/v1/projects/${proj.id}/labels`), fetch(`/api/v1/projects/${proj.id}/boards`)]);
    setProjectLabels((await lRes.json()).data || []);
    const boards = (await bRes.json()).data || [];
    if (boards[0]) {
      setBoardId(boards[0].id);
      const boardRes = await fetch(`/api/v1/boards/${boards[0].id}`);
      const board = (await boardRes.json()).data;
      setBoardColumns(board?.columns || []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateProject = async (field: string, value: string) => {
    if (!project) return;
    await fetch(`/api/v1/projects/${project.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    load();
  };

  const createLabel = async () => {
    if (!project || !labelName) return;
    await fetch(`/api/v1/projects/${project.id}/labels`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: labelName, color: labelColor }) });
    setLabelName(""); setLabelColor("blue"); setLabelModal(false); load();
  };

  const deleteLabel = async (id: string) => {
    await fetch(`/api/v1/labels/${id}`, { method: "DELETE" });
    load();
  };

  const updateColumn = async (id: string, field: string, value: any) => {
    await fetch(`/api/v1/columns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    load();
  };

  return (
    <div style={{ padding: "32px 0", maxWidth: 800 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 400 }}>Settings</h2>
      <Tabs>
        <TabList aria-label="Settings sections"><Tab>Project</Tab><Tab>Board Columns</Tab><Tab>Labels</Tab><Tab>Theme</Tab></TabList>
        <TabPanels>
          <TabPanel>
            {project && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>
                <TextInput id="proj-name" labelText="Project Name" defaultValue={project.name} onBlur={(e: React.FocusEvent<HTMLInputElement>) => updateProject("name", e.target.value)} />
                <TextInput id="proj-key" labelText="Project Key" defaultValue={project.key} onBlur={(e: React.FocusEvent<HTMLInputElement>) => updateProject("key", e.target.value)} />
              </div>
            )}
          </TabPanel>
          <TabPanel>
            {boardColumns.map((col: any) => (
              <div key={col.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <TextInput id={`col-name-${col.id}`} labelText="" hideLabel value={col.name} onBlur={(e: React.FocusEvent<HTMLInputElement>) => updateColumn(col.id, "name", e.target.value)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBoardColumns(boardColumns.map((c: any) => c.id === col.id ? { ...c, name: e.target.value } : c))} size="sm" style={{ width: 200 }} />
                <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Color: {col.color}</span>
              </div>
            ))}
          </TabPanel>
          <TabPanel>
            {projectLabels.map((l: any) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Tag>{l.name}</Tag>
                <Button kind="ghost" size="sm" onClick={() => deleteLabel(l.id)}>Delete</Button>
              </div>
            ))}
            <Button size="sm" onClick={() => setLabelModal(true)} style={{ marginTop: 8 }}>Add Label</Button>
          </TabPanel>
          <TabPanel>
            <Toggle id="theme-toggle" labelText="Dark Mode" toggled={theme === "g90"} onToggle={toggleTheme} labelA="Light" labelB="Dark" />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ComposedModal open={labelModal} onClose={() => setLabelModal(false)}>
        <ModalHeader title="New Label" />
        <ModalBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput id="label-name" labelText="Name" value={labelName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelName(e.target.value)} />
            <Dropdown id="label-color" titleText="Color" items={["blue", "green", "red", "purple", "gray", "warm-gray"]} selectedItem={labelColor} onChange={(e: any) => setLabelColor(e.selectedItem)} />
          </div>
        </ModalBody>
        <ModalFooter primaryButtonText="Create" onRequestSubmit={createLabel} />
      </ComposedModal>
    </div>
  );
}
