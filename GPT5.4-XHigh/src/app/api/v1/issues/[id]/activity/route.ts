import { createRouteHandler, ok } from "@/src/shared/api/route";
import { issuesService } from "@/src/modules/issues/application/issues.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const activity = await issuesService.listActivity(session!.user.id, params.id!);
  return ok({ items: activity });
});
