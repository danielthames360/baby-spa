import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
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

// POST - Register a payment for an appointment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
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
    let paymentMethods: PaymentMethodEntry[] = [];
    if (paymentDetails && paymentDetails.length > 0) {
      paymentMethods = (paymentDetails as PaymentDetailInput[]).map((pd) => ({
        method: pd.paymentMethod,
        amount: pd.amount,
        reference: pd.reference || undefined,
      }));
    } else if (paymentMethod) {
      paymentMethods = [
        {
          method: paymentMethod as PaymentMethod,
          amount: amountNum,
          reference: reference || undefined,
        },
      ];
    }

    // Create transaction and update appointment in a transaction
    // Return both transaction and updated appointment from transaction to avoid redundant fetch
    const result = await prisma.$transaction(async (tx) => {
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
        },
      });

      return { updatedAppointment };
    });

    // Create transaction record for the payment (outside prisma transaction)
    const transaction = await transactionService.create({
      type: "INCOME",
      category: "APPOINTMENT_ADVANCE",
      referenceType: "Appointment",
      referenceId: appointmentId,
      items: [
        {
          itemType: "ADVANCE",
          referenceId: appointmentId,
          description: `Anticipo cita - ${pkg?.name || "Servicio"}`,
          unitPrice: amountNum,
        },
      ],
      paymentMethods,
      notes: notes || undefined,
      createdById: session.user.id,
    });

    // Get all transactions for this appointment to return the payments list
    const allTransactions = await transactionService.getByReference(
      "Appointment",
      appointmentId
    );

    return NextResponse.json({
      payment: {
        id: transaction.id,
        appointmentId,
        amount: amountNum,
        paymentType,
        paymentMethods: transaction.paymentMethods,
        notes,
        createdAt: transaction.createdAt,
      },
      appointment: result.updatedAppointment,
      payments: allTransactions.map((t) => ({
        id: t.id,
        appointmentId,
        amount: Number(t.total),
        paymentType: t.category === "APPOINTMENT_ADVANCE" ? "ADVANCE" : "OTHER",
        paymentMethods: t.paymentMethods,
        notes: t.notes,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Register payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
