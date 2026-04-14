import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { IssueTable } from "@/components/issues/IssueTable";

export default async function IssuesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [project] = await db.select().from(schema.projects).limit(1);

  if (!project) return <div>No project found</div>;

  const issues = await db.query.issues.findMany({
    where: eq(schema.issues.projectId, project.id),
    with: { assignee: true, sprint: true },
    orderBy: [desc(schema.issues.updatedAt)],
  });

  const sprints = await db.query.sprints.findMany({
    where: eq(schema.sprints.projectId, project.id),
  });

  const users = await db.select({ id: schema.user.id, name: schema.user.name }).from(schema.user);

  return (
    <div>
      <h1 className="cds--type-productive-heading-05" style={{ marginBottom: "1.5rem" }}>
        Issues
      </h1>
      <IssueTable
        issues={issues}
        projectKey={project.key}
        sprints={sprints}
        users={users}
        projectId={project.id}
      />
    </div>
  );
}
