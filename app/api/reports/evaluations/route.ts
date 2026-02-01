import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { evaluationsReportSchema } from "@/lib/validations/report";

// GET /api/reports/evaluations?limit=50
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);

    const { limit } = validateRequest(
      {
        limit: searchParams.get("limit") || "50",
      },
      evaluationsReportSchema
    );

    const evaluations = await reportService.getPendingEvaluations(limit);

    return successResponse({
      items: evaluations.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        completedAt: e.completedAt?.toISOString() || null,
      })),
      count: evaluations.length,
    });
  } catch (error) {
    return handleApiError(error, "getting pending evaluations");
  }
}
