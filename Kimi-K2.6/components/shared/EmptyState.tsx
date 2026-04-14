"use client";

import { Tile } from "@carbon/react";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <Tile style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ marginBottom: "1rem", color: "var(--cds-text-secondary)" }}>
        {icon || (
          <svg width="48" height="48" viewBox="0 0 32 32" fill="currentColor">
            <path d="M24 6H8a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm0 18H8V8h16z" />
          </svg>
        )}
      </div>
      <h4 className="cds--type-productive-heading-02">{title}</h4>
      {subtitle && (
        <p className="cds--type-body-long-01" style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary)" }}>
          {subtitle}
        </p>
      )}
    </Tile>
  );
}
