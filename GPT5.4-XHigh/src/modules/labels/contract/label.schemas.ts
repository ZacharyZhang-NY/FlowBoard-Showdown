import { z } from "zod";

import { idSchema, timestampSchema } from "@/src/shared/api/common.schemas";

export const labelSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1),
  color: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createLabelSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

export type Label = z.infer<typeof labelSchema>;
export type LabelDto = z.infer<typeof labelSchema>;
export type CreateLabelRequest = z.infer<typeof createLabelSchema>;
