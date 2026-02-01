import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

// GET /api/reports/dashboard?from=2026-01-01&to=2026-01-31
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

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

    const kpis = await reportService.getDashboardKPIs(from, to);

    return successResponse(kpis);
  } catch (error) {
    return handleApiError(error, "getting dashboard KPIs");
  }
}
