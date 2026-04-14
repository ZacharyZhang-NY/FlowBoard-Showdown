import { createRouteHandler, ok, parseJsonBody } from "@/src/shared/api/route";
import { boardsService } from "@/src/modules/boards/application/boards.service";

export const GET = createRouteHandler(async ({ params, request, session }) => {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const board = await boardsService.getBoard(session!.user.id, params.boardId!, searchParams);
  return ok(board);
});

export const PUT = createRouteHandler(async ({ params, request, session }) => {
  const body = await parseJsonBody(request);
  const board = await boardsService.updateBoard(session!.user.id, params.boardId!, body);
  return ok(board);
});

export const DELETE = createRouteHandler(async ({ params, session }) => {
  const result = await boardsService.deleteBoard(session!.user.id, params.boardId!);
  return ok(result);
});
