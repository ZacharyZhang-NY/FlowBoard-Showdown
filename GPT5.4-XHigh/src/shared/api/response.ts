import { NextResponse } from "next/server";

import { AppError, internalError } from "@/src/shared/api/errors";
import { errorCodes } from "@/src/shared/api/error-codes";

type SuccessEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export function dataResponse<T>(
  data: T,
  init?: {
    status?: number;
    meta?: Record<string, unknown>;
    headers?: HeadersInit;
  },
): NextResponse<SuccessEnvelope<T>> {
  const payload: SuccessEnvelope<T> = init?.meta ? { data, meta: init.meta } : { data };
  const responseInit: ResponseInit = init?.headers
    ? {
        status: init?.status ?? 200,
        headers: init.headers,
      }
    : {
        status: init?.status ?? 200,
      };

  return NextResponse.json(
    payload,
    responseInit,
  );
}

export function errorResponse(
  error: AppError,
  requestId?: string,
): NextResponse<ErrorEnvelope> {
  const payload: ErrorEnvelope = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  };

  return NextResponse.json(
    payload,
    {
      status: error.status,
    },
  );
}

export function normalizeUnknownError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return internalError(error.message);
  }

  return internalError("Unexpected error", {
    code: errorCodes.internalError,
  });
}
