import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import {
  withAuth,
  validateRequest,
  handleApiError,
  ApiError,
  createdResponse,
} from "@/lib/api-utils";
import { registerInstallmentPaymentSchema } from "@/lib/validations/package";
import { getNextInstallmentToPay, getPaidInstallmentsCount } from "@/lib/utils/installments";
import {
  transactionService,
  PaymentMethodEntry,
} from "@/lib/services/transaction-service";

// Payment detail input type for split payments
interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

// POST /api/package-payments - Register an installment payment
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const body = await request.json();
    const data = validateRequest(body, registerInstallmentPaymentSchema);

    // Get the package purchase
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: data.packagePurchaseId },
      include: {
        package: true,
      },
    });

    if (!purchase) {
      throw new ApiError(404, "PACKAGE_PURCHASE_NOT_FOUND");
    }

    // Validate installment number
    if (data.installmentNumber < 1 || data.installmentNumber > purchase.installments) {
      throw new ApiError(400, "INVALID_INSTALLMENT_NUMBER");
    }

    // Get existing installment payments (transactions)
    const existingTransactions = await transactionService.getByReference(
      "PackagePurchase",
      data.packagePurchaseId
    );
    const paidInstallmentNumbers = existingTransactions
      .filter((t) => t.category === "PACKAGE_INSTALLMENT")
      .map((t) => {
        // Extract installment number from notes or items
        const installmentItem = t.items.find((i) => i.itemType === "INSTALLMENT");
        return installmentItem?.quantity ?? 0;
      });

    // Check if this installment is already paid
    if (paidInstallmentNumbers.includes(data.installmentNumber)) {
      throw new ApiError(400, "INSTALLMENT_ALREADY_PAID");
    }

    // Validate payment order - can only pay next installment
    const purchaseForCalc = {
      totalSessions: purchase.totalSessions,
      usedSessions: purchase.usedSessions,
      remainingSessions: purchase.remainingSessions,
      installments: purchase.installments,
      installmentAmount: purchase.installmentAmount,
      paidAmount: purchase.paidAmount,
      finalPrice: purchase.finalPrice,
      totalPrice: purchase.totalPrice,
      paymentPlan: purchase.paymentPlan,
      installmentsPayOnSessions: purchase.installmentsPayOnSessions,
    };
    const nextToPay = getNextInstallmentToPay(purchaseForCalc);
    if (nextToPay !== null && data.installmentNumber !== nextToPay) {
      throw new ApiError(400, "INVALID_INSTALLMENT_NUMBER");
    }

    // Validate amount matches installment amount (with small tolerance for rounding)
    if (purchase.installmentAmount) {
      const expectedAmount = purchase.installmentAmount.toNumber();
      const tolerance = 0.01;
      if (Math.abs(data.amount - expectedAmount) > tolerance) {
        throw new ApiError(400, "INVALID_INSTALLMENT_AMOUNT");
      }
    }

    // Normalize payment input: use paymentDetails array if provided, otherwise fall back to single paymentMethod
    let paymentMethods: PaymentMethodEntry[] = [];
    if (data.paymentDetails && data.paymentDetails.length > 0) {
      paymentMethods = (data.paymentDetails as PaymentDetailInput[]).map((pd) => ({
        method: pd.paymentMethod,
        amount: pd.amount,
        reference: pd.reference || undefined,
      }));
    } else if (data.paymentMethod) {
      paymentMethods = [
        {
          method: data.paymentMethod as PaymentMethod,
          amount: data.amount,
          reference: data.reference || undefined,
        },
      ];
    }

    // Create transaction and update purchase
    const result = await prisma.$transaction(async (tx) => {
      // Update purchase paidAmount
      const newPaidAmount = purchase.paidAmount.toNumber() + data.amount;
      const updatedPurchase = await tx.packagePurchase.update({
        where: { id: data.packagePurchaseId },
        data: {
          paidAmount: newPaidAmount,
        },
        include: {
          package: true,
          baby: {
            select: { id: true, name: true },
          },
        },
      });

      return { purchase: updatedPurchase };
    });

    // Create transaction record for the installment payment (outside prisma transaction)
    const transaction = await transactionService.create({
      type: "INCOME",
      category: "PACKAGE_INSTALLMENT",
      referenceType: "PackagePurchase",
      referenceId: data.packagePurchaseId,
      items: [
        {
          itemType: "INSTALLMENT",
          referenceId: data.packagePurchaseId,
          description: `Cuota ${data.installmentNumber} - ${purchase.package.name}`,
          quantity: data.installmentNumber, // Store installment number in quantity
          unitPrice: data.amount,
        },
      ],
      paymentMethods,
      notes: data.notes || undefined,
      createdById: session.user.id,
    });

    // Calculate updated status
    const updatedPurchaseForCalc = {
      totalSessions: result.purchase.totalSessions,
      usedSessions: result.purchase.usedSessions,
      remainingSessions: result.purchase.remainingSessions,
      installments: result.purchase.installments,
      installmentAmount: result.purchase.installmentAmount,
      paidAmount: result.purchase.paidAmount,
      finalPrice: result.purchase.finalPrice,
      totalPrice: result.purchase.totalPrice,
      paymentPlan: result.purchase.paymentPlan,
      installmentsPayOnSessions: result.purchase.installmentsPayOnSessions,
    };
    const paidInstallmentsCount = getPaidInstallmentsCount(updatedPurchaseForCalc);

    return createdResponse({
      payment: {
        id: transaction.id,
        packagePurchaseId: data.packagePurchaseId,
        installmentNumber: data.installmentNumber,
        amount: data.amount,
        paymentMethods: transaction.paymentMethods,
        notes: data.notes || null,
        createdAt: transaction.createdAt,
      },
      purchase: {
        ...result.purchase,
        paidInstallments: paidInstallmentsCount,
        remainingInstallments: result.purchase.installments - paidInstallmentsCount,
      },
    });
  } catch (error) {
    return handleApiError(error, "registering installment payment");
  }
}
