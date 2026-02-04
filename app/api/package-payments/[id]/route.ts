import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  handleApiError,
  ApiError,
  successResponse,
} from "@/lib/api-utils";

// GET /api/package-payments/[id] - Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;

    const payment = await prisma.packagePayment.findUnique({
      where: { id },
      include: {
        packagePurchase: {
          include: {
            package: true,
            baby: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    return successResponse({ payment });
  } catch (error) {
    return handleApiError(error, "fetching package payment");
  }
}

// DELETE /api/package-payments/[id] - Delete/reverse a payment (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;

    // Find the payment
    const payment = await prisma.packagePayment.findUnique({
      where: { id },
      include: {
        packagePurchase: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    // Only allow deleting the most recent payment for a purchase
    const latestPayment = await prisma.packagePayment.findFirst({
      where: { packagePurchaseId: payment.packagePurchaseId },
      orderBy: { installmentNumber: "desc" },
    });

    if (latestPayment && latestPayment.id !== id) {
      throw new ApiError(400, "CAN_ONLY_DELETE_LATEST_PAYMENT");
    }

    // Delete payment and update purchase in transaction
    await prisma.$transaction(async (tx) => {
      // Delete the payment
      await tx.packagePayment.delete({
        where: { id },
      });

      // Update purchase paidAmount
      const newPaidAmount = Math.max(
        0,
        payment.packagePurchase.paidAmount.toNumber() - payment.amount.toNumber()
      );
      await tx.packagePurchase.update({
        where: { id: payment.packagePurchaseId },
        data: {
          paidAmount: newPaidAmount,
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "deleting package payment");
  }
}
