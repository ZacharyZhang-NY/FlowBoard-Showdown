import { eq } from "drizzle-orm";

import { db } from "@/db/index";
import { labels } from "@/db/schema";
import type { LabelDto } from "@/src/modules/labels/contract/label.schemas";

export const labelsRepository = {
  listByProject(projectId: string) {
    return db.query.labels.findMany({
      where: eq(labels.projectId, projectId),
      orderBy: (label, operators) => [operators.asc(label.name)],
    });
  },

  create(projectId: string, values: { name: string; color: string }) {
    return db
      .insert(labels)
      .values({
        projectId,
        name: values.name,
        color: values.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  },

  delete(labelId: string) {
    return db.delete(labels).where(eq(labels.id, labelId)).returning();
  },

  findById(labelId: string) {
    return db.query.labels.findFirst({
      where: eq(labels.id, labelId),
    });
  },
};
