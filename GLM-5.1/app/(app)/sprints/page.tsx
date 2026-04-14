"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabList, Tab, TabPanels, TabPanel, Tile, Button, ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput, TextArea, ProgressBar, Tag, StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListBody, StructuredListCell } from "@carbon/react";
import { getStatusLabel, getStatusTagKind, formatDate } from "@/lib/utils";

export default function SprintsPage() {
  const [sprints, setSprints] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");

  const load = useCallback(async () => {
    const projRes = await fetch("/api/v1/projects");
    const proj = (await projRes.json()).data?.[0];
    if (!proj) return;
    setProjectId(proj.id);
    const res = await fetch(`/api/v1/projects/${proj.id}/sprints`);
    setSprints((await res.json()).data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    await fetch(`/api/v1/projects/${projectId}/sprints`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, goal }) });
    setName(""); setGoal(""); setModalOpen(false); load();
  };

  const startSprint = async (id: string) => {
    const start = new Date(); const end = new Date(start.getTime() + 14 * 86400000);
    await fetch(`/api/v1/sprints/${id}/start`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startDate: start.toISOString(), endDate: end.toISOString() }) });
    load();
  };

  const completeSprint = async (id: string) => {
    await fetch(`/api/v1/sprints/${id}/complete`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    load();
  };

  const planning = sprints.filter((s) => s.status === "planning");
  const active = sprints.filter((s) => s.status === "active");
  const completed = sprints.filter((s) => s.status === "completed");

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontWeight: 400 }}>Sprints</h2>
        <Button onClick={() => setModalOpen(true)}>New Sprint</Button>
      </div>

      <Tabs>
        <TabList aria-label="Sprint categories">
          <Tab>Planning ({planning.length})</Tab>
          <Tab>Active ({active.length})</Tab>
          <Tab>Completed ({completed.length})</Tab>
        </TabList>
        <TabPanels>
          {[planning, active, completed].map((list, idx) => (
            <TabPanel key={idx}>
              {list.length === 0 ? <p style={{ padding: 16, color: "var(--cds-text-secondary)" }}>No sprints</p> : list.map((s) => (
                <Tile key={s.id} style={{ marginBottom: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4>{s.name}</h4>
                      {s.goal && <p style={{ fontSize: 14, color: "var(--cds-text-secondary)" }}>{s.goal}</p>}
                      {s.startDate && s.endDate && <p style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>{formatDate(s.startDate)} — {formatDate(s.endDate)}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {s.status === "planning" && <Button size="sm" onClick={() => startSprint(s.id)}>Start</Button>}
                      {s.status === "active" && <Button size="sm" kind="danger" onClick={() => completeSprint(s.id)}>Complete</Button>}
                      <Tag kind={s.status === "active" ? "blue" : s.status === "completed" ? "green" : "gray"}>{s.status}</Tag>
                    </div>
                  </div>
                </Tile>
              ))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <ComposedModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader title="New Sprint" />
        <ModalBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput id="sprint-name" labelText="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <TextArea id="sprint-goal" labelText="Goal" value={goal} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoal(e.target.value)} rows={3} />
          </div>
        </ModalBody>
        <ModalFooter primaryButtonText="Create" onRequestSubmit={create} />
      </ComposedModal>
    </div>
  );
}
