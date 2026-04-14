import { errorCodes, type ErrorCode } from "@/src/shared/api/error-codes";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  public constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function ensure(condition: unknown, error: AppError): asserts condition {
  if (!condition) {
    throw error;
  }
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError(errorCodes.validationError, message, 422, details);
}

export function notFound(message: string, details?: unknown): AppError {
  return new AppError(errorCodes.notFound, message, 404, details);
}

export function forbidden(message: string, details?: unknown): AppError {
  return new AppError(errorCodes.forbidden, message, 403, details);
}

export function authRequired(message = "Authentication required"): AppError {
  return new AppError(errorCodes.authRequired, message, 401);
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(errorCodes.conflict, message, 409, details);
}

export function preconditionFailed(
  message: string,
  details?: unknown,
): AppError {
  return new AppError(errorCodes.preconditionFailed, message, 412, details);
}

export function rateLimited(message: string): AppError {
  return new AppError(errorCodes.rateLimited, message, 429);
}

export function internalError(message: string, details?: unknown): AppError {
  return new AppError(errorCodes.internalError, message, 500, details);
}
