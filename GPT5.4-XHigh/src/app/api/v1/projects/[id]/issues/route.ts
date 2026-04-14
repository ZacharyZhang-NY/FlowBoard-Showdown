import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const GET = createRouteHandler(async ({ params, request, session }) => {
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const issues = await issuesService.listIssues(session!.user.id, params.id!, query);
  return ok(issues);
});

export const POST = createRouteHandler(async ({ params, request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const issue = await issuesService.createIssue(session!.user.id, params.id!, body, requestId);
  return ok(issue, 201);
});
