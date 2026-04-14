import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { boardsService } from "@/src/modules/boards/application/boards.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const boards = await boardsService.listBoards(session!.user.id, params.id!);
  return ok({ items: boards });
});

export const POST = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const board = await boardsService.createBoard(session!.user.id, params.id!, body);
  return ok(board, 201);
});
