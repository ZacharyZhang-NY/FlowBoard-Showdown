import { renderMetrics } from "@/src/shared/observability/metrics";

export async function GET(): Promise<Response> {
  return new Response(renderMetrics(), {
    status: 200,
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
