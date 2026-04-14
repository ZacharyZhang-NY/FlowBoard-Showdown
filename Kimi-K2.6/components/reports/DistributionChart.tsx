"use client";

import { DonutChart } from "@carbon/charts-react";

interface DistributionChartProps {
  data: any[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  return (
    <DonutChart
      data={data}
      options={{
        title: "",
        resizable: true,
        donut: { center: { label: "Issues" }, alignment: "center" as const },
        height: "300px",
      }}
    />
  );
}
