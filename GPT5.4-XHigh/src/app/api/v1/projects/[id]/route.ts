import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { projectsService } from "@/src/modules/projects/application/projects.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const project = await projectsService.getProject(session!.user.id, params.id!);
  return ok(project);
});

export const PUT = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const project = await projectsService.updateProject(session!.user.id, params.id!, body);
  return ok(project);
});

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const result = await projectsService.deleteProject(session!.user.id, params.id!);
  return ok(result);
});
