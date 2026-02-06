import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse } from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { dateRangeSchema } from "@/lib/validations/report";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

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
      dateRangeSchema
    );

    const [fromYear, fromMonth, fromDay] = fromStr.split("-").map(Number);
    const [toYear, toMonth, toDay] = toStr.split("-").map(Number);
    const from = getStartOfDayUTC(parseDateToUTCNoon(fromYear, fromMonth, fromDay));
    const to = getEndOfDayUTC(parseDateToUTCNoon(toYear, toMonth, toDay));

    const report = await reportService.getCashflowReport(from, to);
    return successResponse(report);
  } catch (error) {
    return handleApiError(error, "getting cashflow report");
  }
}
