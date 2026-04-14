"use client";

import type { ReactNode } from "react";
import { ClickableTile, ProgressBar, Tag, Tile } from "@carbon/react";

type MetricTileProps = {
  label: string;
  value: number | string;
  helper?: string;
  href?: string;
  trendLabel?: string;
  trendType?: "gray" | "blue" | "green" | "purple" | "red" | "warm-gray";
  progress?: {
    value: number;
    max: number;
    label: string;
  };
};

export function MetricTile({
  label,
  value,
  helper,
  href,
  trendLabel,
  trendType = "gray",
  progress,
}: MetricTileProps) {
  const content: ReactNode = (
    <>
      <div className="flowboard-metric-tile__header">
        <span className="flowboard-eyebrow">{label}</span>
        {trendLabel ? <Tag type={trendType}>{trendLabel}</Tag> : null}
      </div>
      <div className="flowboard-metric-tile__value">{value}</div>
      {helper ? <p className="flowboard-metric-tile__helper">{helper}</p> : null}
      {progress ? (
        <ProgressBar
          className="flowboard-metric-tile__progress"
          helperText={progress.label}
          label=""
          max={progress.max}
          size="small"
          value={progress.value}
        />
      ) : null}
    </>
  );

  return href ? (
    <ClickableTile className="flowboard-metric-tile" href={href}>
      {content}
    </ClickableTile>
  ) : (
    <Tile className="flowboard-metric-tile">{content}</Tile>
  );
}
