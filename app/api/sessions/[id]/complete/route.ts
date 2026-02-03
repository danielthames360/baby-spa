import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  packageId: z.string().optional(), // Package to sell (if baby has no active package)
  packagePurchaseId: z.string().optional(), // Existing package purchase to use for this session
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]).optional(),
  paymentDetails: z.array(paymentDetailSchema).optional(), // Split payment support
  paymentNotes: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  discountReason: z.string().optional(),
  useFirstSessionDiscount: z.boolean().optional(), // Apply Baby Card first session discount
});

// POST /api/sessions/[id]/complete - Complete a session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can complete sessions
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: sessionId } = await params;

    const body = await request.json();
    const validationResult = completeSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { packageId, packagePurchaseId, paymentMethod, paymentDetails, paymentNotes, discountAmount, discountReason, useFirstSessionDiscount } = validationResult.data;

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
    console.error("Error completing session:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        SESSION_NOT_FOUND: { message: "SESSION_NOT_FOUND", status: 404 },
        SESSION_ALREADY_COMPLETED: {
          message: "SESSION_ALREADY_COMPLETED",
          status: 400,
        },
        SESSION_NOT_IN_PROGRESS: {
          message: "SESSION_NOT_IN_PROGRESS",
          status: 400,
        },
        PACKAGE_NO_REMAINING_SESSIONS: {
          message: "PACKAGE_NO_REMAINING_SESSIONS",
          status: 400,
        },
      };

      const mappedError = errorMap[error.message];
      if (mappedError) {
        return NextResponse.json(
          { error: mappedError.message },
          { status: mappedError.status }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
