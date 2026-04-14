"use client";

import { StructuredListWrapper, StructuredListRow, StructuredListCell, StructuredListBody } from "@carbon/react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLogEntry } from "@/types";

export function ActivityFeed({ activity }: { activity: ActivityLogEntry[] }) {
  return (
    <StructuredListWrapper>
      <StructuredListBody>
        {activity.map((a) => (
          <StructuredListRow key={a.id}>
            <StructuredListCell>
              <div style={{ fontWeight: 600 }}>{a.user?.name || "Unknown"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", marginBottom: "0.25rem" }}>
                {formatDistanceToNow(new Date(a.createdAt))} ago
              </div>
              <div>
                {a.action}
                {a.oldValue && a.newValue && (
                  <span style={{ color: "var(--cds-text-secondary)" }}>
                    {" "}: {a.oldValue} &rarr; {a.newValue}
                  </span>
                )}
              </div>
            </StructuredListCell>
          </StructuredListRow>
        ))}
        {activity.length === 0 && (
          <StructuredListRow>
            <StructuredListCell>No activity yet</StructuredListCell>
          </StructuredListRow>
        )}
      </StructuredListBody>
    </StructuredListWrapper>
  );
}
