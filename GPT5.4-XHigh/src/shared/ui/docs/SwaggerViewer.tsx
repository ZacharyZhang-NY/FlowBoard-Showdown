"use client";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

type SwaggerViewerProps = {
  spec: object;
};

export function SwaggerViewer({ spec }: SwaggerViewerProps) {
  return (
    <main className="flowboard-docs">
      <SwaggerUI spec={spec} />
    </main>
  );
}
