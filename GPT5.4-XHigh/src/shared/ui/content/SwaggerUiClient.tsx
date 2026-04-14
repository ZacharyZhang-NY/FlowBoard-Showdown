"use client";

import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
});

type SwaggerUiClientProps = {
  spec: object;
};

export function SwaggerUiClient({ spec }: SwaggerUiClientProps) {
  return <SwaggerUI spec={spec} />;
}
