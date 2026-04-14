import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { boardsService } from "@/src/modules/boards/application/boards.service";

export const PUT = createRouteHandler(async ({ request, session }) => {
  const body = await parseJsonBody(request);
  const board = await boardsService.reorderColumns(session!.user.id, body);
  return ok(board);
});
