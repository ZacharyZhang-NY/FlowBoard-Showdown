"use client";

import { useState, useEffect } from "react";
import { ClickableTile, Tile, Tag } from "@carbon/react";
import {
  StructuredListWrapper,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
} from "@carbon/react";
import { Loading } from "@carbon/react";
import { useProjects } from "@/hooks/use-projects";
import { formatRelativeTime } from "@/lib/utils";
import type { DistributionDataPoint } from "@/types";
import StatusChart from "@/components/dashboard/StatusChart";
import UserAvatarComponent from "@/components/shared/UserAvatar";

type DashboardStats = {
  openIssues: number;
  activeSprint: { name: string; completed: number; total: number } | null;
  myAssigned: number;
  overdue: number;
};

type ActivityEntry = {
  id: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  issueId: string;
  user: { id: string; name: string; email: string; image: string | null };
};

export default function DashboardPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [distribution, setDistribution] = useState<DistributionDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = projects[0]?.id;

  useEffect(() => {
    if (!projectId) return;

    async function loadDashboard() {
      try {
        const [issuesRes, sprintsRes, distRes] = await Promise.all([
          fetch(`/api/v1/projects/${projectId}/issues?limit=200`),
          fetch(`/api/v1/projects/${projectId}/sprints`),
          fetch(`/api/v1/projects/${projectId}/reports/distribution`),
        ]);

        const issuesJson = await issuesRes.json();
        const sprintsJson = await sprintsRes.json();
        const distJson = await distRes.json();

        const allIssues = issuesJson.data?.issues || [];
        const allSprints = sprintsJson.data || [];

        const now = new Date();
        const openIssues = allIssues.filter(
          (i: { status: string }) => i.status !== "done"
        ).length;

        const activeSprint = allSprints.find(
          (s: { status: string }) => s.status === "active"
        );

        const sprintIssues = activeSprint
          ? allIssues.filter(
              (i: { sprintId: string | null }) => i.sprintId === activeSprint.id
            )
          : [];
        const sprintCompleted = sprintIssues.filter(
          (i: { status: string }) => i.status === "done"
        ).length;

        // Get current session for my assigned count
        const sessionRes = await fetch("/api/auth/get-session");
        const sessionJson = await sessionRes.json();
        const userId = sessionJson?.user?.id;

        const myAssigned = userId
          ? allIssues.filter(
              (i: { assigneeId: string | null; status: string }) =>
                i.assigneeId === userId && i.status !== "done"
            ).length
          : 0;

        const overdue = allIssues.filter(
          (i: { dueDate: string | null; status: string }) =>
            i.dueDate && new Date(i.dueDate) < now && i.status !== "done"
        ).length;

        setStats({
          openIssues,
          activeSprint: activeSprint
            ? {
                name: activeSprint.name,
                completed: sprintCompleted,
                total: sprintIssues.length,
              }
            : null,
          myAssigned,
          overdue,
        });

        if (distJson.data) {
          setDistribution(distJson.data.byStatus || []);
        }

        // Load recent activity from all issues
        const activityPromises = allIssues.slice(0, 5).map(
          (issue: { id: string }) =>
            fetch(`/api/v1/issues/${issue.id}/activity`).then((r) => r.json())
        );
        const activityResults = await Promise.all(activityPromises);
        const allActivity = activityResults
          .flatMap((r) => r.data || [])
          .sort(
            (a: ActivityEntry, b: ActivityEntry) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 20);

        setActivity(allActivity);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [projectId]);

  if (projectsLoading || loading) {
    return <Loading withOverlay={false} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        <ClickableTile className="stat-card" href="/issues">
          <div className="stat-value">{stats?.openIssues ?? 0}</div>
          <div className="stat-label">Open Issues</div>
        </ClickableTile>

        <ClickableTile className="stat-card" href="/sprints">
          <div className="stat-value">
            {stats?.activeSprint
              ? `${stats.activeSprint.completed}/${stats.activeSprint.total}`
              : "—"}
          </div>
          <div className="stat-label">
            {stats?.activeSprint
              ? stats.activeSprint.name
              : "No Active Sprint"}
          </div>
        </ClickableTile>

        <ClickableTile className="stat-card" href="/issues">
          <div className="stat-value">{stats?.myAssigned ?? 0}</div>
          <div className="stat-label">My Assigned</div>
        </ClickableTile>

        <ClickableTile className="stat-card" href="/issues">
          <div className="stat-value">
            {stats?.overdue ?? 0}
            {(stats?.overdue ?? 0) > 0 && (
              <Tag type="red" size="sm" style={{ marginLeft: "0.5rem" }}>
                overdue
              </Tag>
            )}
          </div>
          <div className="stat-label">Overdue</div>
        </ClickableTile>
      </div>

      <div className="dashboard-charts">
        <Tile>
          <h3 className="section-title">Recent Activity</h3>
          {activity.length > 0 ? (
            <StructuredListWrapper isCondensed>
              <StructuredListBody>
                {activity.map((entry) => (
                  <StructuredListRow key={entry.id}>
                    <StructuredListCell>
                      <div className="flex-row">
                        <UserAvatarComponent
                          name={entry.user?.name || "Unknown"}
                          size="small"
                        />
                        <span>
                          <strong>{entry.user?.name}</strong> {entry.action.replace("_", " ")}
                          {entry.newValue && ` — ${entry.newValue}`}
                        </span>
                      </div>
                    </StructuredListCell>
                    <StructuredListCell>
                      {formatRelativeTime(entry.createdAt)}
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          ) : (
            <p>No recent activity</p>
          )}
        </Tile>

        <StatusChart data={distribution} />
      </div>
    </div>
  );
}
