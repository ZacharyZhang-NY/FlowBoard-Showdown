import { createRouteHandler, ok } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const activity = await issuesService.listProjectActivity(session!.user.id, params.id!, 20);
  return ok(activity);
});
