import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { incomeReportSchema } from "@/lib/validations/report";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

// GET /api/reports/income?from=2026-01-01&to=2026-01-31
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);

    // Default to current month if no date range (using UTC)
    const now = new Date();
    const defaultFromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0));
    const defaultToDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12, 0, 0));

    const { from: fromStr, to: toStr } = validateRequest(
      {
        from: searchParams.get("from") || defaultFromDate.toISOString().split("T")[0],
        to: searchParams.get("to") || defaultToDate.toISOString().split("T")[0],
      },
      incomeReportSchema
    );

    // Parse dates using UTC noon, then get day boundaries
    const [fromYear, fromMonth, fromDay] = fromStr.split("-").map(Number);
    const [toYear, toMonth, toDay] = toStr.split("-").map(Number);
    const from = getStartOfDayUTC(parseDateToUTCNoon(fromYear, fromMonth, fromDay));
    const to = getEndOfDayUTC(parseDateToUTCNoon(toYear, toMonth, toDay));

    const report = await reportService.getIncomeReport(from, to);

    return successResponse(report);
  } catch (error) {
    return handleApiError(error, "getting income report");
  }
}
