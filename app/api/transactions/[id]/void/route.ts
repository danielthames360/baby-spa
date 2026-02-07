import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { voidTransactionSchema } from "@/lib/validations/transaction";
import { voidTransaction } from "@/lib/services/transaction-service";
import { hasPermission } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(["OWNER", "ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const { reason } = validateRequest(body, voidTransactionSchema);

    // Load the transaction to check category-based permissions
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
    if (transaction.voidedAt) throw new Error("TRANSACTION_ALREADY_VOIDED");
    if (transaction.isReversal) throw new Error("CANNOT_VOID_REVERSAL");

    // Staff payments require staff-payments:delete (OWNER only)
    if (transaction.category === "STAFF_PAYMENT") {
      if (!hasPermission(session.user.role, "staff-payments:delete")) {
        throw new Error("FORBIDDEN");
      }
    }

    // Execute everything atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the reversal entry
      const { original, reversal } = await voidTransaction(
        id,
        reason,
        session.user.id,
        tx
      );

      // 2. Apply side effects based on category
      await applySideEffects(tx, transaction, reason, session.user.id, session.user.name);

      // 3. Log activity
      await tx.activity.create({
        data: {
          type: "TRANSACTION_VOIDED",
          title: "activity.transaction_voided",
          description: `${transaction.category} - ${Number(transaction.total)} - ${reason}`,
          performedById: session.user.id,
          entityType: "Transaction",
          entityId: id,
        },
      });

      return { original, reversal };
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "voiding transaction");
  }
}

// ============================================================
// SIDE EFFECTS BY CATEGORY
// ============================================================

async function applySideEffects(
  tx: Prisma.TransactionClient,
  transaction: {
    id: string;
    category: string;
    referenceType: string;
    referenceId: string;
    total: Prisma.Decimal;
    items: {
      id: string;
      itemType: string;
      referenceId: string | null;
      quantity: number;
    }[];
  },
  reason: string,
  voidedById: string,
  voidedByName: string
) {
  switch (transaction.category) {
    case "APPOINTMENT_ADVANCE":
      await handleAdvanceVoid(tx, transaction, reason, voidedById, voidedByName);
      break;
    case "SESSION":
    case "SESSION_PRODUCTS":
      await handleSessionVoid(tx, transaction, reason, voidedById, voidedByName);
      break;
    case "EVENT_REGISTRATION":
      await handleEventRegistrationVoid(tx, transaction);
      break;
    case "EVENT_PRODUCTS":
      await handleEventProductsVoid(tx, transaction);
      break;
    case "ADMIN_EXPENSE":
      await handleExpenseVoid(tx, transaction, voidedById);
      break;
    // STAFF_PAYMENT, BABY_CARD, PACKAGE_SALE, PACKAGE_INSTALLMENT
    // No additional side effects needed - reversal handles the math
  }
}

// Scenario #1: Void Advance Payment
async function handleAdvanceVoid(
  tx: Prisma.TransactionClient,
  transaction: { id: string; referenceId: string; total: Prisma.Decimal },
  reason: string,
  voidedById: string,
  voidedByName: string
) {
  // Check if appointment still exists
  const appointment = await tx.appointment.findUnique({
    where: { id: transaction.referenceId },
  });

  if (!appointment) return;

  // Check if there are other valid advances for this appointment
  const otherAdvances = await tx.transaction.count({
    where: {
      category: "APPOINTMENT_ADVANCE",
      referenceId: transaction.referenceId,
      id: { not: transaction.id },
      voidedAt: null,
      isReversal: false,
    },
  });

  // If no other advances and appointment was SCHEDULED, revert to PENDING_PAYMENT
  if (otherAdvances === 0 && appointment.status === "SCHEDULED") {
    await tx.appointment.update({
      where: { id: transaction.referenceId },
      data: {
        status: "PENDING_PAYMENT",
        isPendingPayment: true,
      },
    });
  }

  // Log in AppointmentHistory
  await tx.appointmentHistory.create({
    data: {
      appointmentId: transaction.referenceId,
      action: "ADVANCE_VOIDED",
      performedBy: voidedById,
      performerType: "USER",
      performerName: voidedByName,
      newValue: {
        voidedAmount: Number(transaction.total),
        reason,
      },
    },
  });
}

// Scenario #4: Void Session Checkout
async function handleSessionVoid(
  tx: Prisma.TransactionClient,
  transaction: {
    id: string;
    referenceId: string;
    items: { itemType: string; referenceId: string | null; quantity: number }[];
  },
  reason: string,
  voidedById: string,
  voidedByName: string
) {
  const session = await tx.session.findUnique({
    where: { id: transaction.referenceId },
    include: {
      appointment: true,
      products: {
        include: { product: true },
      },
      babyCardSessionLog: true,
    },
  });

  if (!session) return;

  // Handle package: new package sold vs existing package used
  if (session.packagePurchaseId) {
    const wasNewPackageSold = transaction.items.some(
      (i) => i.itemType === "PACKAGE"
    );

    if (wasNewPackageSold) {
      // A new package was created during this checkout - deactivate it
      await tx.packagePurchase.update({
        where: { id: session.packagePurchaseId },
        data: { isActive: false },
      });
      // Unlink session from the voided package
      await tx.session.update({
        where: { id: session.id },
        data: { packagePurchaseId: null },
      });
    } else {
      // Existing package was used - restore the session count
      await tx.packagePurchase.update({
        where: { id: session.packagePurchaseId },
        data: {
          remainingSessions: { increment: 1 },
          usedSessions: { decrement: 1 },
        },
      });
    }
  }

  // Restore product stock
  for (const sp of session.products) {
    const updatedProduct = await tx.product.update({
      where: { id: sp.productId },
      data: {
        currentStock: { increment: sp.quantity },
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: sp.productId,
        type: "ADJUSTMENT",
        quantity: sp.quantity,
        unitPrice: 0,
        totalAmount: 0,
        stockAfter: updatedProduct.currentStock,
        notes: `Void session checkout ${session.id} - Stock restored`,
      },
    });
  }

  // Revert Baby Card session log
  if (session.babyCardSessionLog) {
    await tx.babyCardPurchase.update({
      where: { id: session.babyCardSessionLog.babyCardPurchaseId },
      data: {
        completedSessions: { decrement: 1 },
      },
    });
    await tx.babyCardSessionLog.delete({
      where: { id: session.babyCardSessionLog.id },
    });
  }

  // Revert session status to EVALUATED (pre-checkout state)
  await tx.session.update({
    where: { id: session.id },
    data: {
      status: "EVALUATED",
      completedAt: null,
    },
  });

  // Revert appointment status
  await tx.appointment.update({
    where: { id: session.appointmentId },
    data: { status: "IN_PROGRESS" },
  });

  // Log in AppointmentHistory
  await tx.appointmentHistory.create({
    data: {
      appointmentId: session.appointmentId,
      action: "SESSION_VOIDED",
      performedBy: voidedById,
      performerType: "USER",
      performerName: voidedByName,
      newValue: { reason },
    },
  });
}

// Scenario #6: Void Event Registration Payment
async function handleEventRegistrationVoid(
  tx: Prisma.TransactionClient,
  transaction: { referenceId: string; total: Prisma.Decimal }
) {
  const participant = await tx.eventParticipant.findUnique({
    where: { id: transaction.referenceId },
  });

  if (!participant) return;

  const voidedAmount = Number(transaction.total);
  const newAmountPaid = Math.max(
    0,
    Number(participant.amountPaid) - voidedAmount
  );

  await tx.eventParticipant.update({
    where: { id: participant.id },
    data: {
      amountPaid: newAmountPaid,
      status:
        newAmountPaid >= Number(participant.amountDue)
          ? "CONFIRMED"
          : "REGISTERED",
    },
  });
}

// Scenario #6b: Void Event Product Sale
async function handleEventProductsVoid(
  tx: Prisma.TransactionClient,
  transaction: {
    items: {
      itemType: string;
      referenceId: string | null;
      quantity: number;
    }[];
  }
) {
  for (const item of transaction.items) {
    if (item.itemType === "PRODUCT" && item.referenceId) {
      const updatedProduct = await tx.product.update({
        where: { id: item.referenceId },
        data: {
          currentStock: { increment: item.quantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.referenceId,
          type: "ADJUSTMENT",
          quantity: item.quantity,
          unitPrice: 0,
          totalAmount: 0,
          stockAfter: updatedProduct.currentStock,
          notes: "Void event product sale - Stock restored",
        },
      });
    }
  }
}

// Scenario #7: Void Admin Expense
async function handleExpenseVoid(
  tx: Prisma.TransactionClient,
  transaction: { referenceId: string },
  voidedById: string
) {
  const expense = await tx.expense.findFirst({
    where: {
      id: transaction.referenceId,
      deletedAt: null,
    },
  });

  if (expense) {
    await tx.expense.update({
      where: { id: expense.id },
      data: {
        deletedAt: new Date(),
        deletedById: voidedById,
      },
    });
  }
}
