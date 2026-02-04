import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const payments = await prisma.appointmentPayment.findMany({
      where: { appointmentId: id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalPaid = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
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
