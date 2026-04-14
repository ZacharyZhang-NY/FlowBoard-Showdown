import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { boardsService } from "@/src/modules/boards/application/boards.service";

export const POST = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const board = await boardsService.createColumn(session!.user.id, params.boardId!, body);
  return ok(board, 201);
});
