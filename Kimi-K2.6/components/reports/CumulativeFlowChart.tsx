"use client";

import { AreaChart } from "@carbon/charts-react";

interface CumulativeFlowChartProps {
  data: any[];
}

export function CumulativeFlowChart({ data }: CumulativeFlowChartProps) {
  return (
    <AreaChart
      data={data}
      options={{
        title: "",
        axes: {
          bottom: { title: "Date", mapsTo: "date", scaleType: "labels" as any },
          left: { mapsTo: "value", title: "Issues" },
        },
        height: "300px",
        resizable: true,
      } as any}
    />
  );
}
