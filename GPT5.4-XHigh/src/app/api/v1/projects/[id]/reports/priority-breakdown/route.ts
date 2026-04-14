import { createRouteHandler, ok } from "@/src/shared/api/route";
import { reportsService } from "@/src/modules/reports/application/reports.service";

export const GET = createRouteHandler(async ({ params, session }) => {
  const report = await reportsService.getPriorityBreakdown(session!.user.id, params.id!);
  return ok(report);
});
