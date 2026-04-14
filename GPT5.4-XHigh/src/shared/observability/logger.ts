type LogLevel = "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  message: string;
  scope: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

function write(entry: LogEntry): void {
  const payload = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(payload);
    return;
  }

  if (entry.level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

export const logger = {
  info(scope: string, message: string, metadata?: Record<string, unknown>): void {
    write({
      level: "info",
      scope,
      message,
      ...(metadata ? { metadata } : {}),
      timestamp: new Date().toISOString(),
    });
  },
  warn(scope: string, message: string, metadata?: Record<string, unknown>): void {
    write({
      level: "warn",
      scope,
      message,
      ...(metadata ? { metadata } : {}),
      timestamp: new Date().toISOString(),
    });
  },
  error(
    scope: string,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string,
  ): void {
    write({
      level: "error",
      scope,
      message,
      ...(metadata ? { metadata } : {}),
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
    });
  },
};
