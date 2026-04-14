export const errorCodes = {
  validationError: "VALIDATION_ERROR",
  authRequired: "AUTH_REQUIRED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  preconditionFailed: "PRECONDITION_FAILED",
  rateLimited: "RATE_LIMITED",
  internalError: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];
