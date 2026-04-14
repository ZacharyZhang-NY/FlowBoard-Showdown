import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { sprintsService } from "@/src/modules/sprints/application/sprints.service";

export const PUT = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const sprint = await sprintsService.updateSprint(session!.user.id, params.id!, body);
  return ok(sprint);
});
