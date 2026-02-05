import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
  ApiError,
} from "@/lib/api-utils";
import { staffPaymentService } from "@/lib/services/staff-payment-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/staff-payments/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER"]);

    const { id } = await params;
    const payment = await staffPaymentService.getById(id);

    if (!payment) {
      throw new ApiError(404, "PAYMENT_NOT_FOUND");
    }

    // Serialize decimals
    const serialized = {
      ...payment,
      grossAmount: Number(payment.grossAmount),
      netAmount: Number(payment.netAmount),
      advanceDeducted: payment.advanceDeducted
        ? Number(payment.advanceDeducted)
        : null,
      staff: {
        ...payment.staff,
        baseSalary: payment.staff.baseSalary
          ? Number(payment.staff.baseSalary)
          : null,
      },
      transactions: payment.transactions.map((t) => ({
        ...t,
        subtotal: Number(t.subtotal),
        discountTotal: Number(t.discountTotal),
        total: Number(t.total),
        items: t.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          finalPrice: Number(item.finalPrice),
        })),
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "getting staff payment");
  }
}

// DELETE /api/staff-payments/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await withAuth(["OWNER"]);

    const { id } = await params;
    const result = await staffPaymentService.delete(id, session.user.id);

    // Serialize decimals
    const serialized = {
      ...result,
      grossAmount: Number(result.grossAmount),
      netAmount: Number(result.netAmount),
      advanceDeducted: result.advanceDeducted
        ? Number(result.advanceDeducted)
        : null,
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "deleting staff payment");
  }
}
