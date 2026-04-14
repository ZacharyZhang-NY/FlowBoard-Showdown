"use client";

import { Button, Tile } from "@carbon/react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body>
        <main className="flowboard-error-page">
          <Tile className="flowboard-panel flowboard-error-panel">
            <h1>Application crashed</h1>
            <p>{error.message}</p>
            <Button kind="primary" onClick={reset} size="sm">
              Reload
            </Button>
          </Tile>
        </main>
      </body>
    </html>
  );
}
