import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (fromStr && toStr) {
      const [fromYear, fromMonth, fromDay] = fromStr.split("-").map(Number);
      const [toYear, toMonth, toDay] = toStr.split("-").map(Number);
      from = getStartOfDayUTC(parseDateToUTCNoon(fromYear, fromMonth, fromDay));
      to = getEndOfDayUTC(parseDateToUTCNoon(toYear, toMonth, toDay));
    } else {
      // Default to current month (using UTC)
      const now = new Date();
      from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }

    const report = await reportService.getCashflowReport(from, to);
    return successResponse(report);
  } catch (error) {
    return handleApiError(error, "getting cashflow report");
  }
}
