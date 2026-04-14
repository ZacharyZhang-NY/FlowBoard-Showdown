import { createRouteHandler, ok } from "@/src/shared/api/route";

export const GET = createRouteHandler(
  async () =>
    ok({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  {
    auth: "public",
  },
);
