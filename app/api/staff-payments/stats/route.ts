import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { staffPaymentService } from "@/lib/services/staff-payment-service";
import { z } from "zod";

const statsSchema = z.object({
  staffId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

// GET /api/staff-payments/stats?staffId=xxx&periodStart=2026-01-01&periodEnd=2026-01-31
export async function GET(request: NextRequest) {
  try {
    await withAuth(["ADMIN"]);

    const { searchParams } = new URL(request.url);

    const parsed = statsSchema.safeParse({
      staffId: searchParams.get("staffId"),
      periodStart: searchParams.get("periodStart"),
      periodEnd: searchParams.get("periodEnd"),
    });

    if (!parsed.success) {
      return successResponse({ error: "INVALID_PARAMETERS" }, 400);
    }

    const { staffId, periodStart, periodEnd } = parsed.data;
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);

    // Get stats and salary preview in parallel
    const [stats, salaryPreview] = await Promise.all([
      staffPaymentService.getStaffStats(staffId, periodStartDate, periodEndDate),
      staffPaymentService.getSalaryPreview(staffId, periodStartDate, periodEndDate),
    ]);

    return successResponse({
      stats,
      salaryPreview: {
        ...salaryPreview,
        movements: {
          income: salaryPreview.movements.income.map((m) => ({
            id: m.id,
            type: m.type,
            description: m.description,
            grossAmount: Number(m.grossAmount),
            movementDate: m.movementDate?.toISOString() || null,
          })),
          expenses: salaryPreview.movements.expenses.map((m) => ({
            id: m.id,
            type: m.type,
            description: m.description,
            grossAmount: Number(m.grossAmount),
            movementDate: m.movementDate?.toISOString() || null,
          })),
          totalIncome: salaryPreview.movements.totalIncome,
          totalExpenses: salaryPreview.movements.totalExpenses,
        },
        period: {
          start: salaryPreview.period.start.toISOString(),
          end: salaryPreview.period.end.toISOString(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error, "getting staff stats");
  }
}
