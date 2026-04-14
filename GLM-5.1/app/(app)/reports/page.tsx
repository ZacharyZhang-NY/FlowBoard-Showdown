"use client";

import { useState, useEffect, useCallback } from "react";
import { Tile } from "@carbon/react";

export default function ReportsPage() {
  const [dist, setDist] = useState<any>(null);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");

  const load = useCallback(async () => {
    const projRes = await fetch("/api/v1/projects");
    const proj = (await projRes.json()).data?.[0];
    if (!proj) return;
    setProjectId(proj.id);
    const [dRes, vRes] = await Promise.all([fetch(`/api/v1/projects/${proj.id}/reports/distribution`), fetch(`/api/v1/projects/${proj.id}/reports/velocity`)]);
    setDist((await dRes.json()).data);
    setVelocity((await vRes.json()).data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "32px 0" }}>
      <h2 style={{ marginBottom: 24, fontWeight: 400 }}>Reports</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <Tile>
          <h4 style={{ fontWeight: 400, marginBottom: 16 }}>Issues by Status</h4>
          {dist?.byStatus?.map((s: any) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{s.name}</span><strong>{s.count}</strong>
            </div>
          ))}
        </Tile>
        <Tile>
          <h4 style={{ fontWeight: 400, marginBottom: 16 }}>Issues by Priority</h4>
          {dist?.byPriority?.map((s: any) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{s.name}</span><strong>{s.count}</strong>
            </div>
          ))}
        </Tile>
        <Tile>
          <h4 style={{ fontWeight: 400, marginBottom: 16 }}>Issues by Type</h4>
          {dist?.byType?.map((s: any) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{s.name}</span><strong>{s.count}</strong>
            </div>
          ))}
        </Tile>
        <Tile>
          <h4 style={{ fontWeight: 400, marginBottom: 16 }}>Velocity</h4>
          {velocity.length === 0 ? <p style={{ color: "var(--cds-text-secondary)" }}>No completed sprints</p> :
           velocity.map((v: any) => (
             <div key={v.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
               <span>{v.name}</span><strong>{v.points} SP</strong>
             </div>
           ))}
        </Tile>
      </div>
    </div>
  );
}
