"use client";

import type { ReactNode } from "react";
import { ScaleTypes } from "@carbon/charts";
import {
  AreaChart,
  DonutChart,
  GroupedBarChart,
  LineChart,
  StackedBarChart,
} from "@carbon/charts-react";
import { Tile } from "@carbon/react";

import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { useCurrentProjectSuspense } from "@/src/state/query/useProjects";
import {
  useBurndownSuspense,
  useCumulativeFlowSuspense,
  useDistributionSuspense,
  usePriorityBreakdownSuspense,
  useVelocitySuspense,
} from "@/src/state/query/useReports";

type CurrentProject = NonNullable<ReturnType<typeof useCurrentProjectSuspense>["currentProject"]>;

type ChartTileProps = {
  title: string;
  children: ReactNode;
};

function ChartTile({ title, children }: ChartTileProps) {
  return (
    <Tile className="flowboard-panel">
      <div className="flowboard-panel__header">
        <h2>{title}</h2>
      </div>
      {children}
    </Tile>
  );
}

export function ReportsScreen() {
  const { currentProject } = useCurrentProjectSuspense();

  if (!currentProject) {
    return null;
  }

  return <ReportsScreenContent currentProject={currentProject} />;
}

function ReportsScreenContent({ currentProject }: { currentProject: CurrentProject }) {
  const { data: burndown } = useBurndownSuspense(currentProject.id);
  const { data: velocity } = useVelocitySuspense(currentProject.id);
  const { data: distribution } = useDistributionSuspense(currentProject.id);
  const { data: priority } = usePriorityBreakdownSuspense(currentProject.id);
  const { data: cumulativeFlow } = useCumulativeFlowSuspense(currentProject.id);

  return (
    <PageLayout
      description="Delivery and throughput analytics for the active project."
      title="Reports"
    >
      <div className="flowboard-report-grid">
        <ChartTile title="Burndown">
          <LineChart
            data={[
              ...burndown.ideal.map((point) => ({
                date: point.date,
                group: "Ideal",
                value: point.value,
              })),
              ...burndown.actual.map((point) => ({
                date: point.date,
                group: "Actual",
                value: point.value,
              })),
            ]}
            options={{
              axes: {
                left: { mapsTo: "value", title: "Story points" },
                bottom: { mapsTo: "date", scaleType: ScaleTypes.TIME },
              },
              height: "320px",
            }}
          />
        </ChartTile>
        <ChartTile title="Velocity">
          <GroupedBarChart
            data={velocity.items.flatMap((item) => [
              { group: "Committed", key: item.sprintName, value: item.committed },
              { group: "Completed", key: item.sprintName, value: item.completed },
            ])}
            options={{
              axes: {
                left: { mapsTo: "value", title: "Story points" },
                bottom: { mapsTo: "key", scaleType: ScaleTypes.LABELS },
              },
              height: "320px",
            }}
          />
        </ChartTile>
        <ChartTile title="Issue distribution">
          <DonutChart
            data={distribution.items.map((item) => ({
              group: item.status,
              value: item.count,
            }))}
            options={{
              height: "320px",
            }}
          />
        </ChartTile>
        <ChartTile title="Priority breakdown">
          <StackedBarChart
            data={priority.items.map((item) => ({
              group: item.priority,
              key: item.sprintName,
              value: item.count,
            }))}
            options={{
              axes: {
                left: { mapsTo: "value", stacked: true },
                bottom: { mapsTo: "key", scaleType: ScaleTypes.LABELS },
              },
              height: "320px",
            }}
          />
        </ChartTile>
        <ChartTile title="Cumulative flow">
          <AreaChart
            data={cumulativeFlow.items.map((item) => ({
              date: item.date,
              group: item.status,
              value: item.count,
            }))}
            options={{
              axes: {
                left: { mapsTo: "value", stacked: true },
                bottom: { mapsTo: "date", scaleType: ScaleTypes.TIME },
              },
              height: "320px",
            }}
          />
        </ChartTile>
      </div>
    </PageLayout>
  );
}
