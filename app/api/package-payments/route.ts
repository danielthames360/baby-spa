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
import { paymentDetailService } from "@/lib/services/payment-detail-service";

// Payment detail input type for split payments
interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

// POST /api/package-payments - Register an installment payment
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["ADMIN", "RECEPTION"]);

    const body = await request.json();
    const data = validateRequest(body, registerInstallmentPaymentSchema);

    // Get the package purchase with existing payments
    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: data.packagePurchaseId },
      include: {
        installmentPayments: {
          orderBy: { installmentNumber: "asc" },
        },
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

    // Check if this installment is already paid
    const existingPayment = purchase.installmentPayments.find(
      (p) => p.installmentNumber === data.installmentNumber
    );
    if (existingPayment) {
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
    const normalizedPaymentDetails = paymentDetailService.normalizePaymentInput({
      paymentMethod: data.paymentMethod as PaymentMethod | undefined,
      paymentReference: data.reference || null,
      paymentDetails: data.paymentDetails as PaymentDetailInput[] | undefined,
      totalAmount: data.amount,
    });

    // Use the first payment method as the "primary" method for backwards compatibility
    const primaryMethod = normalizedPaymentDetails.length > 0
      ? normalizedPaymentDetails[0].paymentMethod
      : (data.paymentMethod as PaymentMethod);

    // Create the payment and update purchase in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.packagePayment.create({
        data: {
          packagePurchaseId: data.packagePurchaseId,
          installmentNumber: data.installmentNumber,
          amount: data.amount,
          paymentMethod: primaryMethod,
          reference: data.reference || null,
          notes: data.notes || null,
          createdById: session.user.id,
        },
      });

      // Create payment details for split payment tracking
      if (normalizedPaymentDetails.length > 0) {
        await paymentDetailService.createMany(
          {
            parentType: "PACKAGE_INSTALLMENT",
            parentId: payment.id,
            details: normalizedPaymentDetails,
            createdById: session.user.id,
          },
          tx
        );
      }

      // Update purchase paidAmount
      const newPaidAmount = purchase.paidAmount.toNumber() + data.amount;
      const updatedPurchase = await tx.packagePurchase.update({
        where: { id: data.packagePurchaseId },
        data: {
          paidAmount: newPaidAmount,
        },
        include: {
          installmentPayments: {
            orderBy: { installmentNumber: "asc" },
          },
          package: true,
          baby: {
            select: { id: true, name: true },
          },
        },
      });

      return { payment, purchase: updatedPurchase };
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
    const paidInstallments = getPaidInstallmentsCount(updatedPurchaseForCalc);

    return createdResponse({
      payment: result.payment,
      purchase: {
        ...result.purchase,
        paidInstallments,
        remainingInstallments: result.purchase.installments - paidInstallments,
      },
    });
  } catch (error) {
    return handleApiError(error, "registering installment payment");
  }
}
