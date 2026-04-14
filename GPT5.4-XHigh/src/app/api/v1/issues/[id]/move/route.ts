import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const PUT = createRouteHandler(async ({ params, request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const issue = await issuesService.moveIssue(session!.user.id, params.id!, body, requestId);
  return ok(issue);
});
