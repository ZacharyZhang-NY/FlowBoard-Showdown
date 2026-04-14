"use client";

import { Tile } from "@carbon/react";
import type { DistributionDataPoint } from "@/types";

type StatusChartProps = {
  data: DistributionDataPoint[];
};

export default function StatusChart({ data }: StatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const colorMap: Record<string, string> = {
    "To Do": "var(--cds-tag-background-gray, #e0e0e0)",
    "In Progress": "var(--cds-tag-background-blue, #d0e2ff)",
    "In Review": "var(--cds-tag-background-purple, #e8daff)",
    "Done": "var(--cds-tag-background-green, #a7f0ba)",
    "Blocked": "var(--cds-tag-background-red, #ffd7d9)",
  };

  return (
    <Tile>
      <h3 className="section-title">Issues by Status</h3>
      {data.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.map((item) => (
            <div key={item.group}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                  fontSize: "0.875rem",
                }}
              >
                <span>{item.group}</span>
                <span>{item.value}</span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--cds-border-subtle)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
                    background: colorMap[item.group] || "var(--cds-interactive)",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No data available</p>
      )}
    </Tile>
  );
}
