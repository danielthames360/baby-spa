import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { attendanceReportSchema } from "@/lib/validations/report";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

// GET /api/reports/attendance?from=2026-01-01&to=2026-01-31
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);

    // Default to current month if no date range (using UTC)
    const now = new Date();
    const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0));
    const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12, 0, 0));

    const { from: fromStr, to: toStr } = validateRequest(
      {
        from: searchParams.get("from") || defaultFrom.toISOString().split("T")[0],
        to: searchParams.get("to") || defaultTo.toISOString().split("T")[0],
      },
      attendanceReportSchema
    );

    // Parse dates using UTC noon, then get day boundaries
    const [fromYear, fromMonth, fromDay] = fromStr.split("-").map(Number);
    const [toYear, toMonth, toDay] = toStr.split("-").map(Number);
    const from = getStartOfDayUTC(parseDateToUTCNoon(fromYear, fromMonth, fromDay));
    const to = getEndOfDayUTC(parseDateToUTCNoon(toYear, toMonth, toDay));

    const [stats, noShows] = await Promise.all([
      reportService.getAttendanceStats(from, to),
      reportService.getNoShows(from, to),
    ]);

    // Calculate totals
    const totals = stats.reduce(
      (acc, s) => ({
        completed: acc.completed + s.completed,
        noShow: acc.noShow + s.noShow,
        cancelled: acc.cancelled + s.cancelled,
        total: acc.total + s.total,
      }),
      { completed: 0, noShow: 0, cancelled: 0, total: 0 }
    );

    return successResponse({
      stats,
      noShows: noShows.map((ns) => ({
        ...ns,
        date: ns.date.toISOString(),
      })),
      totals,
    });
  } catch (error) {
    return handleApiError(error, "getting attendance report");
  }
}
