import { rateLimited } from "@/src/shared/api/errors";

type Bucket = {
  count: number;
  windowStartedAt: number;
};

const buckets = new Map<string, Bucket>();

export function enforceRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
}): void {
  const now = Date.now();
  const bucket = buckets.get(input.key);

  if (!bucket || now - bucket.windowStartedAt >= input.windowMs) {
    buckets.set(input.key, {
      count: 1,
      windowStartedAt: now,
    });
    return;
  }

  if (bucket.count >= input.max) {
    throw rateLimited("Too many requests");
  }

  bucket.count += 1;
}
