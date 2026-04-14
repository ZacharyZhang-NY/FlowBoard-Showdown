"use client";

import { ClickableTile, OverflowMenu, OverflowMenuItem, Tag } from "@carbon/react";

import type { BoardIssueCard } from "@/src/modules/boards/contract/board.schemas";
import { PriorityTag } from "@/src/shared/ui/app/Tags";
import { UserAvatar } from "@/src/shared/ui/app/UserAvatar";

type IssueCardProps = {
  issue: BoardIssueCard;
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <ClickableTile className="flowboard-issue-card" href={`/issues/${issue.id}`}>
      <div className="flowboard-issue-card__top">
        <span className="flowboard-eyebrow">{issue.key}</span>
        <OverflowMenu ariaLabel="Issue actions" size="sm">
          <OverflowMenuItem href={`/issues/${issue.id}`} itemText="Open detail" />
        </OverflowMenu>
      </div>
      <h3>{issue.title}</h3>
      <div className="flowboard-issue-card__meta">
        <PriorityTag priority={issue.priority} />
        <Tag type="cool-gray">{issue.type}</Tag>
        {issue.storyPoints !== null ? <Tag type="outline">{issue.storyPoints} pts</Tag> : null}
      </div>
      <div className="flowboard-issue-card__footer">
        {issue.assignee ? (
          <UserAvatar image={issue.assignee.image} name={issue.assignee.name} />
        ) : (
          <span className="flowboard-subtle">Unassigned</span>
        )}
      </div>
    </ClickableTile>
  );
}
