"use client";

import { Tile, Button } from "@carbon/react";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Tile style={{ textAlign: "center", padding: 48 }}>
      <h3 style={{ marginBottom: 8, fontWeight: 400 }}>{title}</h3>
      {description && (
        <p style={{ color: "var(--cds-text-secondary)", marginBottom: 16 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </Tile>
  );
}
