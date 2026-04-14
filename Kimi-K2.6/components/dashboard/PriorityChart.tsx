"use client";

import { useEffect, useState } from "react";
import { DonutChart } from "@carbon/charts-react";
import { Tile } from "@carbon/react";

interface Props {
  data: Record<string, number>;
}

export function PriorityChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = Object.entries(data).map(([priority, value]) => ({
    group: priority,
    value,
  }));

  return (
    <Tile>
      <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
        Issues by Priority
      </h3>
      <div className="cds--chart-holder" style={{ height: 300 }}>
        {mounted && chartData.length > 0 ? (
          <DonutChart
            data={chartData}
            options={{
              title: "",
              resizable: true,
              donut: { center: { label: "Issues" }, alignment: "center" as const },
              height: "300px",
            }}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--cds-text-secondary)",
            }}
          >
            No data available
          </div>
        )}
      </div>
    </Tile>
  );
}
