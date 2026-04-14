import { createLabelSchema, labelSchema } from "@/src/modules/labels/contract/label.schemas";
import { labelsRepository } from "@/src/modules/labels/infra/labels.repository";
import { ensure, notFound, validationError } from "@/src/shared/api/errors";
import { parseWithSchema } from "@/src/shared/api/validation";
import { requireProjectAdmin, requireProjectMember } from "@/src/shared/auth/authorization";
import { labelColorOptions } from "@/src/shared/constants/labels";
import { toIsoStringRequired } from "@/src/shared/utils/date";

export const labelsService = {
  async listLabels(userId: string, projectId: string) {
    await requireProjectMember(userId, projectId);
    const labels = await labelsRepository.listByProject(projectId);
    return labels.map((label) =>
      labelSchema.parse({
        id: label.id,
        projectId: label.projectId,
        name: label.name,
        color: label.color,
        createdAt: toIsoStringRequired(label.createdAt),
        updatedAt: toIsoStringRequired(label.updatedAt),
      }),
    );
  },

  async createLabel(userId: string, projectId: string, payload: unknown) {
    await requireProjectAdmin(userId, projectId);
    const values = parseWithSchema(createLabelSchema, payload);
    ensure(
      labelColorOptions.includes(values.color as (typeof labelColorOptions)[number]),
      validationError("Unsupported label color"),
    );

    const [label] = await labelsRepository.create(projectId, values);
    ensure(label, notFound("Label not created"));
    return labelSchema.parse({
      id: label.id,
      projectId: label.projectId,
      name: label.name,
      color: label.color,
      createdAt: toIsoStringRequired(label.createdAt),
      updatedAt: toIsoStringRequired(label.updatedAt),
    });
  },

  async deleteLabel(userId: string, labelId: string) {
    const label = await labelsRepository.findById(labelId);
    ensure(label, notFound("Label not found"));
    await requireProjectAdmin(userId, label.projectId);

    const deleted = await labelsRepository.delete(labelId);
    ensure(deleted[0], notFound("Label not found"));

    return {
      id: deleted[0].id,
      deletedAt: new Date().toISOString(),
    };
  },
};
