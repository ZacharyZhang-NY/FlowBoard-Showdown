"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { ScaleTypes } from "@carbon/charts";
import { DonutChart, SimpleBarChart } from "@carbon/charts-react";
import {
  Column,
  Grid,
  Link,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
  Tile,
} from "@carbon/react";

import { MetricTile } from "@/src/shared/ui/app/MetricTile";
import { PageLayout } from "@/src/shared/ui/app/PageLayout";
import { StatusTag } from "@/src/shared/ui/app/Tags";
import { useDashboardSummarySuspense, useCurrentProjectSuspense } from "@/src/state/query/useProjects";
import { useIssuesSuspense } from "@/src/state/query/useIssues";

type CurrentProject = NonNullable<ReturnType<typeof useCurrentProjectSuspense>["currentProject"]>;

export function DashboardScreen() {
  const { currentProject } = useCurrentProjectSuspense();

  if (!currentProject) {
    return null;
  }

  return <DashboardScreenContent currentProject={currentProject} />;
}

function DashboardScreenContent({ currentProject }: { currentProject: CurrentProject }) {
  const { data: summary } = useDashboardSummarySuspense(currentProject.id);
  const { data: issues } = useIssuesSuspense(currentProject.id, {
    page: 1,
    pageSize: 100,
    sortBy: "updatedAt",
    sortDirection: "desc",
  });

  const statusData = issues.items.map((issue) => ({
    group: "Issues",
    key: issue.status,
    value: 1,
  }));
  const priorityCounts = issues.items.reduce<Record<string, number>>((accumulator, issue) => {
    accumulator[issue.priority] = (accumulator[issue.priority] ?? 0) + 1;
    return accumulator;
  }, {});
  const priorityData = Object.entries(priorityCounts).map(([key, value]) => ({
    group: key,
    value,
  }));
  const statusCounts = issues.items.reduce<Record<string, number>>((accumulator, issue) => {
    accumulator[issue.status] = (accumulator[issue.status] ?? 0) + 1;
    return accumulator;
  }, {});

  const summaryStrip = (
    <Grid className="flowboard-metric-strip" condensed fullWidth>
      <Column lg={4} md={4} sm={4}>
        <MetricTile
          helper="Open issues across the current project"
          href="/issues"
          label={summary.openIssues.label}
          trendLabel={`${summary.openIssues.trend}`}
          value={summary.openIssues.value}
        />
      </Column>
      <Column lg={4} md={4} sm={4}>
        <MetricTile
          helper={summary.activeSprint.name ?? "No active sprint"}
          label="Active Sprint"
          progress={{
            value: summary.activeSprint.completedStoryPoints,
            max: Math.max(summary.activeSprint.totalStoryPoints, 1),
            label: `${summary.activeSprint.completedStoryPoints}/${summary.activeSprint.totalStoryPoints} story points`,
          }}
          value={summary.activeSprint.name ?? "Backlog"}
        />
      </Column>
      <Column lg={4} md={4} sm={4}>
        <MetricTile
          helper="Assigned to your account"
          href="/issues"
          label={summary.myAssigned.label}
          trendLabel={`${summary.myAssigned.trend}`}
          value={summary.myAssigned.value}
        />
      </Column>
      <Column lg={4} md={4} sm={4}>
        <MetricTile
          helper="Past due and unresolved"
          label={summary.overdue.label}
          trendLabel={summary.overdue.value > 0 ? "Attention" : "Clear"}
          trendType={summary.overdue.value > 0 ? "red" : "green"}
          value={summary.overdue.value}
        />
      </Column>
    </Grid>
  );

  return (
    <PageLayout
      description="Current delivery health for the active project."
      summary={summaryStrip}
      title={currentProject.name}
    >
      <Grid className="flowboard-dashboard-grid" condensed fullWidth>
        <Column lg={8} md={8} sm={4}>
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h2>Recent activity</h2>
            </div>
            <StructuredListWrapper>
              <StructuredListBody>
                {summary.recentActivity.map((activity) => (
                  <StructuredListRow key={activity.id}>
                    <StructuredListCell>
                      <div className="flowboard-activity-row">
                        <div>
                          <strong>{activity.actor.name}</strong> {activity.action}
                          {activity.issueKey ? (
                            <>
                              {" "}
                              <Link href={`/issues/${activity.issueId}`}>{activity.issueKey}</Link>
                            </>
                          ) : null}
                        </div>
                        <div className="flowboard-subtle">
                          {formatDistanceToNow(parseISO(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
        </Column>
        <Column lg={8} md={8} sm={4}>
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h2>Issues by status</h2>
            </div>
            <SimpleBarChart
              data={statusData}
              options={{
                axes: {
                  left: {
                    mapsTo: "value",
                    title: "Count",
                  },
                  bottom: {
                    mapsTo: "key",
                    scaleType: ScaleTypes.LABELS,
                  },
                },
                height: "320px",
              }}
            />
          </Tile>
        </Column>
        <Column lg={8} md={8} sm={4}>
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h2>Issues by priority</h2>
            </div>
            <DonutChart
              data={priorityData}
              options={{
                donut: {
                  alignment: "center",
                },
                height: "320px",
                resizable: true,
              }}
            />
          </Tile>
        </Column>
        <Column lg={8} md={8} sm={4}>
          <Tile className="flowboard-panel">
            <div className="flowboard-panel__header">
              <h2>Status snapshot</h2>
            </div>
            <div className="flowboard-tag-grid">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div className="flowboard-tag-grid__item" key={status}>
                  <StatusTag status={status as Parameters<typeof StatusTag>[0]["status"]} />
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </Tile>
        </Column>
      </Grid>
    </PageLayout>
  );
}
