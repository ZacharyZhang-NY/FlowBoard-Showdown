"use client";

import { Button, Tile } from "@carbon/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="app-fallback">
      <Tile className="app-fallback__tile">
        <h1>页面渲染失败</h1>
        <p>{error.message}</p>
        <Button onClick={reset}>重试</Button>
      </Tile>
    </div>
  );
}
