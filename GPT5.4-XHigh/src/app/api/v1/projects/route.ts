import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { projectsService } from "@/src/modules/projects/application/projects.service";

export const GET = createRouteHandler(async ({ session }) => {
  const projects = await projectsService.listProjects(session!.user.id);
  return ok({ items: projects });
});

export const POST = createRouteHandler(async ({ request, session, requestId }) => {
  const body = await parseJsonBody(request);
  const project = await projectsService.createProject(session!.user.id, body);
  return ok(project, 201);
});
