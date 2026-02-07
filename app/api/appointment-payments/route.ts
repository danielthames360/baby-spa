import { NextResponse } from "next/server";
import { withAuth, validateRequest, handleApiError, requireOpenCashRegister } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import {
  transactionService,
  PaymentMethodEntry,
} from "@/lib/services/transaction-service";
import { z } from "zod";

const paymentDetailSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]),
  reference: z.string().nullable().optional(),
});

const appointmentPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  amount: z.number().min(0.01),
  paymentMethod: z.enum(["CASH", "QR", "CARD", "TRANSFER"]).optional(),
  paymentType: z.enum(["ADVANCE", "COMPLETION", "PARTIAL"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDetails: z.array(paymentDetailSchema).optional(),
}).refine(
  (data) => data.paymentMethod || (data.paymentDetails && data.paymentDetails.length > 0),
  { message: "Either paymentMethod or paymentDetails must be provided", path: ["paymentMethod"] }
);

// POST - Register a payment for an appointment
export async function POST(request: Request) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    // Enforce cash register for RECEPTION
    const cashRegisterId = await requireOpenCashRegister(session.user.id, session.user.role);
    if (session.user.role === "RECEPTION" && !cashRegisterId) {
      return NextResponse.json(
        { error: "CASH_REGISTER_REQUIRED", message: "Cash register must be open to process payments" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { appointmentId, amount, paymentMethod, paymentType, reference, notes, paymentDetails } = validateRequest(body, appointmentPaymentSchema);

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

    // Validate minimum amount for advance payments (only enforce for PENDING_PAYMENT → first payment)
    if (
      paymentType === "ADVANCE" &&
      requiredAdvance > 0 &&
      amount < requiredAdvance &&
      appointment.status === "PENDING_PAYMENT"
    ) {
      return NextResponse.json(
        { error: "AMOUNT_BELOW_MINIMUM", minimum: requiredAdvance },
        { status: 400 }
      );
    }

    // Normalize payment input: use paymentDetails array if provided, otherwise fall back to single paymentMethod
    let paymentMethods: PaymentMethodEntry[] = [];
    if (paymentDetails && paymentDetails.length > 0) {
      paymentMethods = paymentDetails.map((pd) => ({
        method: pd.paymentMethod,
        amount: pd.amount,
        reference: pd.reference || undefined,
      }));
    } else if (paymentMethod) {
      paymentMethods = [
        {
          method: paymentMethod,
          amount,
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
              paymentAmount: amount,
              paymentMethod,
            },
          },
        });
      }

      // Log history for advance payments on already-scheduled appointments
      if (
        paymentType === "ADVANCE" &&
        appointment.status === "SCHEDULED"
      ) {
        await tx.appointmentHistory.create({
          data: {
            appointmentId,
            action: "ADVANCE_PAYMENT",
            performedBy: session.user.id,
            performerType: "USER",
            performerName: session.user.name || "Staff",
            oldValue: { status: "SCHEDULED" },
            newValue: {
              status: "SCHEDULED",
              paymentAmount: amount,
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
          unitPrice: amount,
        },
      ],
      paymentMethods,
      notes: notes || undefined,
      createdById: session.user.id,
      cashRegisterId: cashRegisterId ?? undefined,
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
        amount: amount,
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
    return handleApiError(error, "registering appointment payment");
  }
}
