import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const comments = await issuesService.listComments(session!.user.id, params.id!);
  return ok({ items: comments });
});

export const POST = createRouteHandler(async ({ params, request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const comment = await issuesService.createComment(session!.user.id, params.id!, body, requestId);
  return ok(comment, 201);
});
