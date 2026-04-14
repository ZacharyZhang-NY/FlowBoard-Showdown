"use client";

import { LineChart } from "@carbon/charts-react";

interface BurndownChartProps {
  data: any[];
}

export function BurndownChart({ data }: BurndownChartProps) {
  return (
    <LineChart
      data={data}
      options={{
        title: "",
        axes: {
          bottom: { title: "Date", mapsTo: "date", scaleType: "labels" as any },
          left: { mapsTo: "value", title: "Points" },
        },
        height: "300px",
        resizable: true,
      } as any}
    />
  );
}
