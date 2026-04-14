"use client";

import { useState, useEffect } from "react";
import { Tile, Loading } from "@carbon/react";
import { useProjects } from "@/hooks/use-projects";
import type { BurndownDataPoint, VelocityDataPoint, DistributionDataPoint } from "@/types";

export default function ReportsPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const projectId = projects[0]?.id || null;

  const [burndown, setBurndown] = useState<BurndownDataPoint[]>([]);
  const [velocity, setVelocity] = useState<VelocityDataPoint[]>([]);
  const [distribution, setDistribution] = useState<{
    byStatus: DistributionDataPoint[];
    byPriority: DistributionDataPoint[];
    byType: DistributionDataPoint[];
  }>({ byStatus: [], byPriority: [], byType: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    async function loadReports() {
      try {
        const [burnRes, velRes, distRes] = await Promise.all([
          fetch(`/api/v1/projects/${projectId}/reports/burndown`),
          fetch(`/api/v1/projects/${projectId}/reports/velocity`),
          fetch(`/api/v1/projects/${projectId}/reports/distribution`),
        ]);

        const burnJson = await burnRes.json();
        const velJson = await velRes.json();
        const distJson = await distRes.json();

        if (burnJson.data) setBurndown(burnJson.data);
        if (velJson.data) setVelocity(velJson.data);
        if (distJson.data) setDistribution(distJson.data);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [projectId]);

  if (projectsLoading || loading) {
    return <Loading withOverlay={false} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <div className="reports-grid">
        {/* Burndown Chart */}
        <Tile className="report-tile">
          <h4>Sprint Burndown</h4>
          {burndown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                <span>Start</span>
                <span>End</span>
              </div>
              <div style={{ position: "relative", height: "200px", border: "1px solid var(--cds-border-subtle)", borderRadius: "4px", padding: "0.5rem" }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Ideal line */}
                  <line x1="0" y1="0" x2="100" y2="100" stroke="var(--cds-border-strong)" strokeWidth="1" strokeDasharray="4,4" />
                  {/* Actual line */}
                  {burndown.filter(d => d.actual !== null).length > 1 && (
                    <polyline
                      fill="none"
                      stroke="var(--cds-interactive)"
                      strokeWidth="2"
                      points={burndown
                        .filter(d => d.actual !== null)
                        .map((d, i, arr) => {
                          const x = (i / (arr.length - 1)) * 100;
                          const maxVal = burndown[0]?.ideal || 1;
                          const y = 100 - ((d.actual || 0) / maxVal) * 100;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  )}
                </svg>
              </div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", marginTop: "0.5rem" }}>
                <span>— Ideal</span>
                <span style={{ color: "var(--cds-interactive)" }}>— Actual</span>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--cds-text-secondary)" }}>No active sprint data</p>
          )}
        </Tile>

        {/* Velocity Chart */}
        <Tile className="report-tile">
          <h4>Velocity</h4>
          {velocity.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: "200px", paddingTop: "1rem" }}>
              {velocity.map((item) => {
                const maxVal = Math.max(...velocity.map((v) => Math.max(v.committed, v.completed)), 1);
                return (
                  <div key={item.sprint} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "160px" }}>
                      <div
                        style={{
                          width: "20px",
                          height: `${(item.committed / maxVal) * 160}px`,
                          background: "var(--cds-border-subtle)",
                          borderRadius: "2px 2px 0 0",
                        }}
                        title={`Committed: ${item.committed}`}
                      />
                      <div
                        style={{
                          width: "20px",
                          height: `${(item.completed / maxVal) * 160}px`,
                          background: "var(--cds-interactive)",
                          borderRadius: "2px 2px 0 0",
                        }}
                        title={`Completed: ${item.completed}`}
                      />
                    </div>
                    <span style={{ fontSize: "0.625rem", color: "var(--cds-text-secondary)" }}>{item.sprint}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--cds-text-secondary)" }}>No sprint data</p>
          )}
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            <span>■ Committed</span>
            <span style={{ color: "var(--cds-interactive)" }}>■ Completed</span>
          </div>
        </Tile>

        {/* Issues by Status */}
        <Tile className="report-tile">
          <h4>Issues by Status</h4>
          {distribution.byStatus.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              {distribution.byStatus.map((item) => {
                const total = distribution.byStatus.reduce((s, d) => s + d.value, 0);
                return (
                  <div key={item.group}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      <span>{item.group}</span>
                      <span>{item.value}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--cds-border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(item.value / total) * 100}%`, background: "var(--cds-interactive)", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--cds-text-secondary)" }}>No data</p>
          )}
        </Tile>

        {/* Issues by Priority */}
        <Tile className="report-tile">
          <h4>Issues by Priority</h4>
          {distribution.byPriority.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              {distribution.byPriority.map((item) => {
                const total = distribution.byPriority.reduce((s, d) => s + d.value, 0);
                const colorMap: Record<string, string> = {
                  Critical: "var(--cds-support-error)",
                  High: "var(--cds-support-warning)",
                  Medium: "var(--cds-interactive)",
                  Low: "var(--cds-border-strong)",
                };
                return (
                  <div key={item.group}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      <span>{item.group}</span>
                      <span>{item.value}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--cds-border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(item.value / total) * 100}%`, background: colorMap[item.group] || "var(--cds-interactive)", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--cds-text-secondary)" }}>No data</p>
          )}
        </Tile>

        {/* Issues by Type */}
        <Tile className="report-tile">
          <h4>Issues by Type</h4>
          {distribution.byType.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              {distribution.byType.map((item) => {
                const total = distribution.byType.reduce((s, d) => s + d.value, 0);
                return (
                  <div key={item.group}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      <span>{item.group}</span>
                      <span>{item.value}</span>
                    </div>
                    <div style={{ height: "8px", background: "var(--cds-border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(item.value / total) * 100}%`, background: "var(--cds-interactive)", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--cds-text-secondary)" }}>No data</p>
          )}
        </Tile>
      </div>
    </div>
  );
}
