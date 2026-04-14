import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { sprintsService } from "@/src/modules/sprints/application/sprints.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const sprints = await sprintsService.listSprints(session!.user.id, params.id!);
  return ok({ items: sprints });
});

export const POST = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const sprint = await sprintsService.createSprint(session!.user.id, params.id!, body);
  return ok(sprint, 201);
});
