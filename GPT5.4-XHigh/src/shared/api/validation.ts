import { type ZodType } from "zod";

import { validationError } from "@/src/shared/api/errors";

export function parseWithSchema<TSchema extends ZodType>(
  schema: TSchema,
  value: unknown,
): TSchema["_output"] {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw validationError("Validation failed", result.error.flatten());
  }

  return result.data as TSchema["_output"];
}
