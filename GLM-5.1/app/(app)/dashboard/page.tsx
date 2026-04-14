import { db } from "@/db";
import { issues, projects, sprints, activityLog, user } from "@/db/schema";
import { eq, desc, and, ne, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Tag, ClickableTile, ProgressBar, StructuredListRow, StructuredListCell, StructuredListBody, StructuredListHead, StructuredListWrapper } from "@carbon/react";
import { getStatusTagKind, getStatusLabel, getPriorityTagKind, getPriorityLabel, formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;
  const [project] = db.select().from(projects).limit(1).all();
  if (!project) return <div>No projects found</div>;

  const allIssues = db.select().from(issues).where(eq(issues.projectId, project.id)).all();
  const openCount = allIssues.filter((i) => i.status !== "done").length;
  const myCount = allIssues.filter((i) => i.assigneeId === userId && i.status !== "done").length;
  const overdueCount = allIssues.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "done").length;

  const [activeSprint] = db.select().from(sprints).where(and(eq(sprints.projectId, project.id), eq(sprints.status, "active"))).limit(1).all();

  const recentActivity = db
    .select({ action: activityLog.action, oldValue: activityLog.oldValue, newValue: activityLog.newValue, createdAt: activityLog.createdAt, userName: user.name, issueId: activityLog.issueId })
    .from(activityLog)
    .innerJoin(user, eq(activityLog.userId, user.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(20)
    .all();

  const statusCounts: Record<string, number> = {};
  allIssues.forEach((i) => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });

  const priorityCounts: Record<string, number> = {};
  allIssues.forEach((i) => { priorityCounts[i.priority] = (priorityCounts[i.priority] || 0) + 1; });

  return (
    <div style={{ padding: "32px 0" }}>
      <h2 style={{ marginBottom: 24, fontWeight: 400 }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <ClickableTile href="/issues"><p style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Open Issues</p><p style={{ fontSize: 28 }}>{openCount}</p></ClickableTile>
        <ClickableTile href="/sprints">
          <p style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Active Sprint</p>
          <p style={{ fontSize: 16 }}>{activeSprint?.name || "None"}</p>
          {activeSprint && <ProgressBar value={allIssues.filter(i => i.sprintId === activeSprint.id && i.status === "done").length} maxLabel="" label="" max={allIssues.filter(i => i.sprintId === activeSprint.id).length || 1} />}
        </ClickableTile>
        <ClickableTile href="/issues"><p style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>My Assigned</p><p style={{ fontSize: 28 }}>{myCount}</p></ClickableTile>
        <ClickableTile href="/issues"><p style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>Overdue</p><p style={{ fontSize: 28 }}>{overdueCount}</p>{overdueCount > 0 && <Tag kind="red">Action needed</Tag>}</ClickableTile>
      </div>

      <h3 style={{ fontWeight: 400, marginBottom: 16 }}>Recent Activity</h3>
      <StructuredListWrapper style={{ marginBottom: 32 }}>
        <StructuredListHead><StructuredListRow head><StructuredListCell head>Action</StructuredListCell><StructuredListCell head>User</StructuredListCell><StructuredListCell head>When</StructuredListCell></StructuredListRow></StructuredListHead>
        <StructuredListBody>
          {recentActivity.map((a) => (
            <StructuredListRow key={a.action + a.createdAt + a.userName}>
              <StructuredListCell>{a.action}: {a.oldValue || ""}{a.oldValue && a.newValue ? " → " : ""}{a.newValue || ""}</StructuredListCell>
              <StructuredListCell>{a.userName}</StructuredListCell>
              <StructuredListCell>{formatRelativeTime(a.createdAt)}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <h3 style={{ fontWeight: 400, marginBottom: 16 }}>Issues by Status</h3>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag kind={getStatusTagKind(status) as "gray" | "blue" | "purple" | "green" | "red"}>{getStatusLabel(status)}</Tag>
              <span>{count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ fontWeight: 400, marginBottom: 16 }}>Issues by Priority</h3>
          {Object.entries(priorityCounts).map(([priority, count]) => (
            <div key={priority} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag kind={getPriorityTagKind(priority) as "gray" | "blue" | "red" | "warm-gray"}>{getPriorityLabel(priority)}</Tag>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
