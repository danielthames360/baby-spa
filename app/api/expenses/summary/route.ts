import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { expenseService } from "@/lib/services/expense-service";
import { expenseSummarySchema } from "@/lib/validations/expense";

// GET /api/expenses/summary?year=2026&month=1
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);
    const { year, month } = validateRequest(
      {
        year: searchParams.get("year"),
        month: searchParams.get("month"),
      },
      expenseSummarySchema
    );

    // Calculate date range for the period
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);

    // Get summary and total in parallel
    const [byCategory, total] = await Promise.all([
      expenseService.getSummaryByCategory(from, to),
      expenseService.getTotal(from, to),
    ]);

    return successResponse({
      year,
      month,
      byCategory,
      total,
    });
  } catch (error) {
    return handleApiError(error, "getting expense summary");
  }
}
