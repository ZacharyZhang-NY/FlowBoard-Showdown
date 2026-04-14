import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { sprintsService } from "@/src/modules/sprints/application/sprints.service";

export const PUT = createRouteHandler(async ({ params, request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const sprint = await sprintsService.completeSprint(session!.user.id, params.id!, body, requestId);
  return ok(sprint);
});
