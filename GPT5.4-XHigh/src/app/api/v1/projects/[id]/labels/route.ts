import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { labelsService } from "@/src/modules/labels/application/labels.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const labels = await labelsService.listLabels(session!.user.id, params.id!);
  return ok({ items: labels });
});

export const POST = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const label = await labelsService.createLabel(session!.user.id, params.id!, body);
  return ok(label, 201);
});
