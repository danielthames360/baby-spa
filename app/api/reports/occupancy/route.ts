import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (fromStr && toStr) {
      // Parse provided dates at UTC noon, then get day boundaries
      const [fromYear, fromMonth, fromDay] = fromStr.split("-").map(Number);
      const [toYear, toMonth, toDay] = toStr.split("-").map(Number);
      from = getStartOfDayUTC(parseDateToUTCNoon(fromYear, fromMonth, fromDay));
      to = getEndOfDayUTC(parseDateToUTCNoon(toYear, toMonth, toDay));
    } else {
      // Default to current week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + diffToMonday,
        0, 0, 0, 0
      ));
      const sunday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + diffToMonday + 6,
        23, 59, 59, 999
      ));

      from = monday;
      to = sunday;
    }

    const report = await reportService.getOccupancyReport(from, to);
    return successResponse(report);
  } catch (error) {
    return handleApiError(error, "getting occupancy report");
  }
}
