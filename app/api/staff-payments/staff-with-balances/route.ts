import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { staffPaymentService } from "@/lib/services/staff-payment-service";

// GET /api/staff-payments/staff-with-balances
export async function GET(request: NextRequest) {
  try {
    await withAuth(["ADMIN"]);

    const staffWithBalances = await staffPaymentService.getStaffWithBalances();

    return successResponse(staffWithBalances);
  } catch (error) {
    return handleApiError(error, "getting staff with balances");
  }
}
