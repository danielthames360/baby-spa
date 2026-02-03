import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
import { paymentDetailService } from "@/lib/services/payment-detail-service";

// Payment detail input type for split payments
interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

// POST - Register a payment for an appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, amount, paymentMethod, paymentType, reference, notes, paymentDetails } = body;

    // Validate required fields (paymentMethod is optional if paymentDetails is provided)
    if (!appointmentId || !amount || !paymentType) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS" },
        { status: 400 }
      );
    }

    // Must have either paymentMethod or paymentDetails
    if (!paymentMethod && (!paymentDetails || paymentDetails.length === 0)) {
      return NextResponse.json(
        { error: "MISSING_PAYMENT_INFO" },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Validate payment method (only if provided directly, not when using paymentDetails)
    const validMethods: PaymentMethod[] = ["CASH", "QR", "CARD", "TRANSFER"];
    if (paymentMethod && !validMethods.includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_METHOD" },
        { status: 400 }
      );
    }

    // Validate payment type
    const validTypes = ["ADVANCE", "COMPLETION", "PARTIAL"];
    if (!validTypes.includes(paymentType)) {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_TYPE" },
        { status: 400 }
      );
    }

    // Get appointment with package info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        selectedPackage: {
          select: {
            id: true,
            name: true,
            advancePaymentAmount: true,
            requiresAdvancePayment: true,
          },
        },
        packagePurchase: {
          select: {
            id: true,
            package: {
              select: {
                id: true,
                name: true,
                advancePaymentAmount: true,
                requiresAdvancePayment: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "APPOINTMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get advance payment amount from the package
    const pkg = appointment.packagePurchase?.package || appointment.selectedPackage;
    const requiredAdvance = pkg?.advancePaymentAmount
      ? parseFloat(pkg.advancePaymentAmount.toString())
      : 0;

    // Validate minimum amount for advance payments
    if (paymentType === "ADVANCE" && requiredAdvance > 0 && amountNum < requiredAdvance) {
      return NextResponse.json(
        { error: "AMOUNT_BELOW_MINIMUM", minimum: requiredAdvance },
        { status: 400 }
      );
    }

    // Normalize payment input: use paymentDetails array if provided, otherwise fall back to single paymentMethod
    const normalizedPaymentDetails = paymentDetailService.normalizePaymentInput({
      paymentMethod: paymentMethod as PaymentMethod | undefined,
      paymentReference: reference,
      paymentDetails: paymentDetails as PaymentDetailInput[] | undefined,
      totalAmount: amountNum,
    });

    // Use the first payment method as the "primary" method for backwards compatibility
    const primaryMethod = normalizedPaymentDetails.length > 0
      ? normalizedPaymentDetails[0].paymentMethod
      : (paymentMethod as PaymentMethod);

    // Create payment and update appointment in a transaction
    // Return both payment and updated appointment from transaction to avoid redundant fetch
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.appointmentPayment.create({
        data: {
          appointmentId,
          amount: amountNum,
          paymentMethod: primaryMethod,
          paymentType,
          reference,
          notes,
          createdById: session.user.id,
        },
      });

      // Create payment details for split payment tracking
      if (normalizedPaymentDetails.length > 0) {
        await paymentDetailService.createMany(
          {
            parentType: "APPOINTMENT",
            parentId: payment.id,
            details: normalizedPaymentDetails,
            createdById: session.user.id,
          },
          tx
        );
      }

      // If this is an advance payment and appointment was pending, confirm it
      if (
        paymentType === "ADVANCE" &&
        appointment.status === "PENDING_PAYMENT"
      ) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: "SCHEDULED",
            isPendingPayment: false,
          },
        });

        // Create history record
        await tx.appointmentHistory.create({
          data: {
            appointmentId,
            action: "PAYMENT_CONFIRMED",
            performedBy: session.user.id,
            performerType: "USER",
            performerName: session.user.name || "Staff",
            oldValue: { status: "PENDING_PAYMENT" },
            newValue: {
              status: "SCHEDULED",
              paymentAmount: amountNum,
              paymentMethod,
            },
          },
        });
      }

      // Fetch updated appointment within transaction (avoids extra query outside)
      const updatedAppointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          baby: {
            select: { id: true, name: true },
          },
          selectedPackage: {
            select: { id: true, name: true },
          },
          packagePurchase: {
            select: {
              id: true,
              package: { select: { name: true } },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return { payment, updatedAppointment };
    });

    return NextResponse.json({
      payment: result.payment,
      appointment: result.updatedAppointment,
    });
  } catch (error) {
    console.error("Register payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
