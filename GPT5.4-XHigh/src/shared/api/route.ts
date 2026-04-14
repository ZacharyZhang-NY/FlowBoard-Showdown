import { NextResponse } from "next/server";

import { normalizeUnknownError } from "@/src/shared/api/response";
import { dataResponse, errorResponse } from "@/src/shared/api/response";
import { logger } from "@/src/shared/observability/logger";
import { incrementMetric } from "@/src/shared/observability/metrics";
import { requireRequestSession } from "@/src/shared/auth/session";
import { enforceRateLimit } from "@/src/shared/security/rate-limit";
import { createRequestId } from "@/src/shared/security/request";
import type { AuthenticatedSession } from "@/src/shared/types/session";
import { getClientIp } from "@/src/shared/utils/http";

type RouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  params: Promise<TParams>;
};

type HandlerContext<TParams extends Record<string, string>> = {
  request: Request;
  params: TParams;
  requestId: string;
  session: AuthenticatedSession | null;
};

type RouteOptions = {
  auth?: "required" | "public";
  rateLimit?: {
    bucket: string;
    max: number;
    windowMs: number;
  };
};

type RouteHandler<TParams extends Record<string, string>> = (
  context: HandlerContext<TParams>,
) => Promise<Response | NextResponse>;

function withRequestId(response: Response, requestId: string): Response {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function createRouteHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<TParams>,
  options?: RouteOptions,
) {
  return async (request: Request, routeContext: RouteContext<TParams>) => {
    const requestId = createRequestId();
    const startedAt = Date.now();
    const params = await routeContext.params;
    const ipAddress = getClientIp(request.headers);

    try {
      if (options?.rateLimit) {
        enforceRateLimit({
          key: `${options.rateLimit.bucket}:${ipAddress}`,
          max: options.rateLimit.max,
          windowMs: options.rateLimit.windowMs,
        });
      }

      const session =
        options?.auth === "public"
          ? null
          : await requireRequestSession(request.headers);

      const response = await handler({
        request,
        params,
        requestId,
        session,
      });

      incrementMetric("flowboard_requests_total", "FlowBoard request count", {
        method: request.method,
        path: new URL(request.url).pathname,
        status: String(response.status),
      });

      logger.info("api", "request_completed", {
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return withRequestId(response, requestId);
    } catch (error) {
      const appError = normalizeUnknownError(error);

      incrementMetric("flowboard_requests_total", "FlowBoard request count", {
        method: request.method,
        path: new URL(request.url).pathname,
        status: String(appError.status),
      });

      logger.error(
        "api",
        appError.message,
        {
          code: appError.code,
          method: request.method,
          path: new URL(request.url).pathname,
          durationMs: Date.now() - startedAt,
          details: appError.details,
        },
        requestId,
      );

      return withRequestId(errorResponse(appError, requestId), requestId);
    }
  };
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  return request.json();
}

export function ok<T>(data: T, status?: number): NextResponse {
  return status === undefined ? dataResponse(data) : dataResponse(data, { status });
}
