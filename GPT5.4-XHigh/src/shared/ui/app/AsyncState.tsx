"use client";

import { InlineLoading, Loading, Tile } from "@carbon/react";

type PageLoadingStateProps = {
  description?: string;
};

export function PageLoadingState({ description }: PageLoadingStateProps) {
  return (
    <div className="flowboard-loading flowboard-loading--page">
      <Loading description={description ?? "Loading"} withOverlay={false} />
    </div>
  );
}

export function SectionLoadingState({ description }: PageLoadingStateProps) {
  return (
    <div className="flowboard-loading flowboard-loading--section">
      <InlineLoading description={description ?? "Loading"} status="active" />
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Tile className="flowboard-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="flowboard-empty-state__action">{action}</div> : null}
    </Tile>
  );
}
