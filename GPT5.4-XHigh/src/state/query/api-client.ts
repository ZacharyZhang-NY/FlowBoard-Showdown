"use client";

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

type ApiSuccessPayload<TData> = {
  data: TData;
  meta?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  public constructor(input: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
    if (input.requestId !== undefined) {
      this.requestId = input.requestId;
    }
  }
}

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function resolveRequestUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_APP_URL");
  }

  return new URL(path, baseUrl).toString();
}

function buildHeaders(init?: ApiRequestInit): Headers {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");

  if (init?.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return headers;
}

export async function apiRequest<TData>(
  path: string,
  init?: ApiRequestInit,
): Promise<TData> {
  const { body, ...requestOptions } = init ?? {};
  const method = requestOptions.method?.toUpperCase() ?? "GET";
  const requestInit: RequestInit = {
    credentials: "include",
    headers: buildHeaders(init),
    ...requestOptions,
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  if (method !== "GET" && method !== "HEAD" && requestInit.keepalive === undefined) {
    requestInit.keepalive = true;
  }

  const response = await fetch(resolveRequestUrl(path), requestInit);

  const payload = (await response.json()) as ApiSuccessPayload<TData> | ApiErrorPayload;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;

    throw new ApiClientError({
      code: errorPayload.error.code,
      message: errorPayload.error.message,
      status: response.status,
      details: errorPayload.error.details,
      ...(errorPayload.error.requestId !== undefined
        ? { requestId: errorPayload.error.requestId }
        : {}),
    });
  }

  return (payload as ApiSuccessPayload<TData>).data;
}
