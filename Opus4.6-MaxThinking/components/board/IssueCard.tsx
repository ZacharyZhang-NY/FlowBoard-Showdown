"use client";

import { Tag } from "@carbon/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { IssueWithRelations } from "@/types";
import { STATUS_TAG_KIND, PRIORITY_TAG_KIND, PRIORITY_LABELS } from "@/types";
import UserAvatarComponent from "@/components/shared/UserAvatar";

type IssueCardProps = {
  issue: IssueWithRelations;
  projectKey: string;
  onClick: (issueId: string) => void;
};

export default function IssueCard({ issue, projectKey, onClick }: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: "issue",
      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`issue-card ${isDragging ? "dragging" : ""}`}
      onClick={() => onClick(issue.id)}
      {...attributes}
      {...listeners}
    >
      <div className="issue-card-header">
        <span className="issue-card-key">
          {projectKey}-{issue.number}
        </span>
        {issue.storyPoints != null && (
          <Tag size="sm" type="high-contrast">
            {issue.storyPoints}
          </Tag>
        )}
      </div>
      <div className="issue-card-title">{issue.title}</div>
      <div className="issue-card-footer">
        <div className="issue-card-tags">
          <Tag
            size="sm"
            type={PRIORITY_TAG_KIND[issue.priority as keyof typeof PRIORITY_TAG_KIND] || "gray"}
          >
            {PRIORITY_LABELS[issue.priority as keyof typeof PRIORITY_LABELS] || issue.priority}
          </Tag>
        </div>
        {issue.assignee && (
          <UserAvatarComponent name={issue.assignee.name} size="small" />
        )}
      </div>
    </div>
  );
}
