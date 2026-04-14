"use client";

import { useEffect, useState } from "react";
import { SimpleBarChart } from "@carbon/charts-react";
import { Tile } from "@carbon/react";

interface Props {
  data: Record<string, number>;
}

export function StatusChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = Object.entries(data).map(([status, value]) => ({
    group: status,
    value,
  }));

  return (
    <Tile>
      <h3 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
        Issues by Status
      </h3>
      <div className="cds--chart-holder" style={{ height: 300 }}>
        {mounted && chartData.length > 0 ? (
          <SimpleBarChart
            data={chartData}
            options={{
              title: "",
              axes: {
                left: { mapsTo: "value" },
                bottom: { mapsTo: "group", scaleType: "labels" as any },
              },
              height: "300px",
              resizable: true,
              color: { scale: {} },
            } as any}
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
