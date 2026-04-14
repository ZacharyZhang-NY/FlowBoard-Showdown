import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { boardsService } from "@/src/modules/boards/application/boards.service";

export const PUT = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const board = await boardsService.updateColumn(session!.user.id, params.id!, body);
  return ok(board);
});

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const board = await boardsService.deleteColumn(session!.user.id, params.id!);
  return ok(board);
});
