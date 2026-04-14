"use client";

import { StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody } from "@carbon/react";
import { Edit, ArrowRight, User, Chat, Flag, Dashboard } from "@carbon/icons-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  issueId: string;
  action: string;
  createdAt: string | Date;
  user?: { name?: string | null } | null;
  issue?: { number?: number | null } | null;
}

function actionIcon(action: string) {
  if (action.includes("commented")) return <Chat size={16} />;
  if (action.includes("assigned")) return <User size={16} />;
  if (action.includes("moved")) return <ArrowRight size={16} />;
  if (action.includes("priority")) return <Flag size={16} />;
  if (action.includes("status")) return <Dashboard size={16} />;
  return <Edit size={16} />;
}

export function RecentActivity({ activities, projectKey }: { activities: Activity[]; projectKey: string }) {
  return (
    <div>
      <h2 className="cds--type-productive-heading-03" style={{ marginBottom: "1rem" }}>
        Recent Activity
      </h2>
      <StructuredListWrapper>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head style={{ width: 40 }} />
            <StructuredListCell head>User</StructuredListCell>
            <StructuredListCell head>Action</StructuredListCell>
            <StructuredListCell head>Issue</StructuredListCell>
            <StructuredListCell head>Time</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {activities.length === 0 && (
            <StructuredListRow>
              <StructuredListCell>No recent activity</StructuredListCell>
            </StructuredListRow>
          )}
          {activities.map((a) => (
            <StructuredListRow key={a.id}>
              <StructuredListCell style={{ color: "var(--cds-text-secondary)" }}>
                {actionIcon(a.action)}
              </StructuredListCell>
              <StructuredListCell>{a.user?.name || "Unknown"}</StructuredListCell>
              <StructuredListCell>{a.action.replace(/_/g, " ")}</StructuredListCell>
              <StructuredListCell>
                {a.issue?.number ? (
                  <Link href={`/issues/${a.issueId}`}>
                    {projectKey}-{a.issue.number}
                  </Link>
                ) : (
                  "-"
                )}
              </StructuredListCell>
              <StructuredListCell>{formatDistanceToNow(new Date(a.createdAt))} ago</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
}
