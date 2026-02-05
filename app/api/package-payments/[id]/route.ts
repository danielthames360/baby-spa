import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  handleApiError,
  ApiError,
  successResponse,
} from "@/lib/api-utils";
import { transactionService } from "@/lib/services/transaction-service";

// GET /api/package-payments/[id] - Get payment details (transaction)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;

    // Get the transaction by ID
    const transaction = await transactionService.getById(id);

    if (!transaction) {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    // Verify it's a package installment transaction
    if (transaction.category !== "PACKAGE_INSTALLMENT") {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    // Get the related package purchase
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id: transaction.referenceId },
      include: {
        package: true,
        baby: {
          select: { id: true, name: true },
        },
      },
    });

    // Get the createdBy user
    const createdBy = transaction.createdById
      ? await prisma.user.findUnique({
          where: { id: transaction.createdById },
          select: { id: true, name: true },
        })
      : null;

    // Extract installment number from the transaction items
    const installmentItem = transaction.items.find(
      (item) => item.itemType === "INSTALLMENT"
    );
    const installmentNumber = installmentItem?.quantity ?? 0;

    return successResponse({
      payment: {
        id: transaction.id,
        packagePurchaseId: transaction.referenceId,
        installmentNumber,
        amount: Number(transaction.total),
        paymentMethods: transaction.paymentMethods,
        notes: transaction.notes,
        createdAt: transaction.createdAt,
        packagePurchase,
        createdBy,
      },
    });
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

    // Find the transaction
    const transaction = await transactionService.getById(id);

    if (!transaction) {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    // Verify it's a package installment transaction
    if (transaction.category !== "PACKAGE_INSTALLMENT") {
      throw new ApiError(404, "PACKAGE_PAYMENT_NOT_FOUND");
    }

    // Get the package purchase
    const packagePurchase = await prisma.packagePurchase.findUnique({
      where: { id: transaction.referenceId },
    });

    if (!packagePurchase) {
      throw new ApiError(404, "PACKAGE_PURCHASE_NOT_FOUND");
    }

    // Get all transactions for this purchase to check if this is the latest
    const allTransactions = await transactionService.getByReference(
      "PackagePurchase",
      transaction.referenceId
    );
    const installmentTransactions = allTransactions
      .filter((t) => t.category === "PACKAGE_INSTALLMENT")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Only allow deleting the most recent payment
    if (installmentTransactions.length > 0 && installmentTransactions[0].id !== id) {
      throw new ApiError(400, "CAN_ONLY_DELETE_LATEST_PAYMENT");
    }

    // Delete transaction and update purchase in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the transaction
      await tx.transaction.delete({
        where: { id },
      });

      // Update purchase paidAmount
      const newPaidAmount = Math.max(
        0,
        packagePurchase.paidAmount.toNumber() - Number(transaction.total)
      );
      await tx.packagePurchase.update({
        where: { id: transaction.referenceId },
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
