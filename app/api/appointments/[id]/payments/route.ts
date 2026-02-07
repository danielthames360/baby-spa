import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";

// GET - List payments/transactions for an appointment (including session)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);
    const { id } = await params;

    // Find session ID linked to this appointment (if any)
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, session: { select: { id: true } } },
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");

    // Build list of reference IDs to search for
    const referenceIds = [id];
    if (appointment.session?.id) {
      referenceIds.push(appointment.session.id);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        referenceId: { in: referenceIds },
        category: {
          in: [
            "APPOINTMENT_ADVANCE",
            "SESSION",
            "SESSION_PRODUCTS",
            "PACKAGE_SALE",
            "PACKAGE_INSTALLMENT",
          ],
        },
      },
      select: {
        id: true,
        category: true,
        total: true,
        paymentMethods: true,
        createdAt: true,
        isReversal: true,
        voidedAt: true,
        voidReason: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const serialized = transactions.map((t) => ({
      ...t,
      total: Number(t.total),
    }));

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching appointment payments");
  }
}
