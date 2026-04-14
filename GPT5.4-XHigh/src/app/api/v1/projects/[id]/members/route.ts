import { createRouteHandler, ok } from "@/src/shared/api/route";
import { projectsService } from "@/src/modules/projects/application/projects.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const members = await projectsService.getProjectMembers(session!.user.id, params.id!);
  return ok({ items: members });
});
