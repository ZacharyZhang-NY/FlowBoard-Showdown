"use client";

import { StackedBarChart } from "@carbon/charts-react";

interface PriorityChartProps {
  data: any[];
}

export function PriorityChart({ data }: PriorityChartProps) {
  return (
    <StackedBarChart
      data={data}
      options={{
        title: "",
        axes: {
          left: { mapsTo: "value", title: "Issues" },
          bottom: { mapsTo: "group", scaleType: "labels" as any },
        },
        height: "300px",
        resizable: true,
      } as any}
    />
  );
}
