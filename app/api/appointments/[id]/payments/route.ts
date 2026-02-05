import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transactionService } from "@/lib/services/transaction-service";

// GET - List payments for an appointment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["OWNER", "ADMIN", "RECEPTION", "THERAPIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get all transactions for this appointment
    const transactions = await transactionService.getByReference(
      "Appointment",
      id
    );

    // Map transactions to the expected payment format
    const payments = transactions.map((t) => ({
      id: t.id,
      appointmentId: id,
      amount: Number(t.total),
      paymentType: t.category === "APPOINTMENT_ADVANCE" ? "ADVANCE" : "OTHER",
      paymentMethods: t.paymentMethods,
      notes: t.notes,
      createdAt: t.createdAt,
      createdById: t.createdById,
    }));

    // Calculate totals
    const totalPaid = payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return NextResponse.json({
      payments,
      totalPaid,
    });
  } catch (error) {
    console.error("Get appointment payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
