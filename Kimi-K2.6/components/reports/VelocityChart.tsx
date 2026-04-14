"use client";

import { GroupedBarChart } from "@carbon/charts-react";

interface VelocityChartProps {
  data: any[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  return (
    <GroupedBarChart
      data={data}
      options={{
        title: "",
        axes: {
          left: { mapsTo: "value", title: "Points" },
          bottom: { mapsTo: "key", scaleType: "labels" as any },
        },
        height: "300px",
        resizable: true,
      } as any}
    />
  );
}
