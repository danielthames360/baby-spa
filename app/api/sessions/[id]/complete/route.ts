import { NextRequest, NextResponse } from "next/server";
import { withAuth, validateRequest, handleApiError } from "@/lib/api-utils";
import { sessionService } from "@/lib/services/session-service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const paymentDetailSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]),
  reference: z.string().optional(),
});

const completeSessionSchema = z.object({
  packageId: z.string().optional(),
  packagePurchaseId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]).optional(),
  paymentDetails: z.array(paymentDetailSchema).optional(),
  paymentNotes: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  discountReason: z.string().optional(),
  useFirstSessionDiscount: z.boolean().optional(),
});

// POST /api/sessions/[id]/complete - Complete a session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);
    const { id: sessionId } = await params;

    const body = await request.json();
    const { packageId, packagePurchaseId, paymentMethod, paymentDetails, paymentNotes, discountAmount, discountReason, useFirstSessionDiscount } = validateRequest(body, completeSessionSchema);

    const result = await sessionService.completeSession({
      sessionId,
      packageId,
      packagePurchaseId,
      paymentMethod,
      paymentDetails,
      paymentNotes,
      discountAmount,
      discountReason,
      useFirstSessionDiscount,
      userId: session.user.id,
      userName: session.user.name || "Unknown",
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "completing session");
  }
}
