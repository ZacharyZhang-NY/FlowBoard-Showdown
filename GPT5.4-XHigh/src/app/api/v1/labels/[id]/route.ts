import { createRouteHandler, ok } from "@/src/shared/api/route";
import { labelsService } from "@/src/modules/labels/application/labels.service";

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const result = await labelsService.deleteLabel(session!.user.id, params.id!);
  return ok(result);
});
