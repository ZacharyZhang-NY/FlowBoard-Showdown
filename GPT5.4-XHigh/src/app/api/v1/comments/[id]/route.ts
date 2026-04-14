import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const PUT = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const comment = await issuesService.updateComment(session!.user.id, params.id!, body);
  return ok(comment);
});

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const result = await issuesService.deleteComment(session!.user.id, params.id!);
  return ok(result);
});
