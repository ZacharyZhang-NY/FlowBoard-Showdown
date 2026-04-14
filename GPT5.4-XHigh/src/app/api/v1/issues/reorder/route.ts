import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const PUT = createRouteHandler(async ({ request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const result = await issuesService.reorderIssues(session!.user.id, body, requestId);
  return ok(result);
});
