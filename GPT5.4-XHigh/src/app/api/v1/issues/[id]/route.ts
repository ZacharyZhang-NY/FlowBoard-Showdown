import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const issue = await issuesService.getIssue(session!.user.id, params.id!);
  return ok(issue);
});

export const PUT = createRouteHandler(async ({ params, request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const issue = await issuesService.updateIssue(session!.user.id, params.id!, body, requestId);
  return ok(issue);
});

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const result = await issuesService.deleteIssue(session!.user.id, params.id!);
  return ok(result);
});
