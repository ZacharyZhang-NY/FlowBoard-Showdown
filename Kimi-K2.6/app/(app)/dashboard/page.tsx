import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { subWeeks, isAfter } from "date-fns";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { PriorityChart } from "@/components/dashboard/PriorityChart";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [project] = await db.select().from(schema.projects).limit(1);
  if (!project) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto" }}>
        <EmptyState title="No project found" subtitle="Create a project to get started." />
      </div>
    );
  }

  const projectId = project.id;

  const allIssues = await db.query.issues.findMany({
    where: eq(schema.issues.projectId, projectId),
  });

  const openIssues = allIssues.filter((i) => i.status !== "done");
  const myAssigned = allIssues.filter((i) => i.assigneeId === userId);
  const overdue = allIssues.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "done");

  const oneWeekAgo = subWeeks(new Date(), 1);
  const recentlyCreated = openIssues.filter((i) => isAfter(new Date(i.createdAt), oneWeekAgo)).length;
  const recentlyDone = allIssues.filter((i) => i.status === "done" && isAfter(new Date(i.updatedAt), oneWeekAgo)).length;
  const openIssuesTrend: "up" | "down" | "stable" = recentlyCreated > recentlyDone ? "up" : recentlyCreated < recentlyDone ? "down" : "stable";

  const activeSprint = await db.query.sprints.findFirst({
    where: and(eq(schema.sprints.projectId, projectId), eq(schema.sprints.status, "active")),
  });

  let sprintProgress = { completed: 0, total: 0 };
  if (activeSprint) {
    const sprintIssues = allIssues.filter((i) => i.sprintId === activeSprint.id);
    sprintProgress = {
      completed: sprintIssues.filter((i) => i.status === "done").reduce((s, i) => s + (i.storyPoints || 0), 0),
      total: sprintIssues.reduce((s, i) => s + (i.storyPoints || 0), 0),
    };
  }

  const recentActivity = await db.query.activityLog.findMany({
    where: inArray(schema.activityLog.issueId, allIssues.map((i) => i.id)),
    with: { user: true, issue: true },
    orderBy: [desc(schema.activityLog.createdAt)],
    limit: 20,
  });

  const statusGroups: Record<string, number> = {};
  for (const issue of allIssues) {
    statusGroups[issue.status] = (statusGroups[issue.status] || 0) + 1;
  }

  const priorityGroups: Record<string, number> = {};
  for (const issue of allIssues) {
    priorityGroups[issue.priority] = (priorityGroups[issue.priority] || 0) + 1;
  }

  return (
    <div>
      <h1 className="cds--type-productive-heading-05" style={{ marginBottom: "1.5rem" }}>
        Dashboard
      </h1>

      <StatCards
        openIssues={openIssues.length}
        openIssuesTrend={openIssuesTrend}
        myAssigned={myAssigned.length}
        overdue={overdue.length}
        activeSprint={activeSprint || null}
        sprintProgress={sprintProgress}
      />

      <div style={{ marginTop: "2rem" }}>
        <RecentActivity activities={recentActivity} projectKey={project.key} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
        <StatusChart data={statusGroups} />
        <PriorityChart data={priorityGroups} />
      </div>
    </div>
  );
}
