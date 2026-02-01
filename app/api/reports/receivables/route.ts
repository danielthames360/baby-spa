import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { receivablesReportSchema } from "@/lib/validations/report";

// GET /api/reports/receivables?status=all
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);

    const { status } = validateRequest(
      {
        status: searchParams.get("status") || "all",
      },
      receivablesReportSchema
    );

    const receivables = await reportService.getReceivables(status);

    // Calculate totals
    const totalPending = receivables.reduce((sum, r) => sum + r.pendingAmount, 0);
    const totalOverdue = receivables
      .filter((r) => r.isOverdue)
      .reduce((sum, r) => sum + r.pendingAmount, 0);

    return successResponse({
      items: receivables,
      summary: {
        totalPending,
        totalOverdue,
        count: receivables.length,
        overdueCount: receivables.filter((r) => r.isOverdue).length,
      },
    });
  } catch (error) {
    return handleApiError(error, "getting receivables report");
  }
}
