import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

// GET /api/events/[id]/participants/[participantId]/purchases - Get purchases for a participant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id: eventId, participantId } = await params;

    // Get participant (baby or parent)
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      select: {
        baby: { select: { name: true } },
        parent: { select: { name: true } },
      },
    });

    if (!participant) {
      return successResponse({ purchases: [], total: 0 });
    }

    // Get participant name (baby or parent)
    const participantName = participant.baby?.name || participant.parent?.name;

    if (!participantName) {
      return successResponse({ purchases: [], total: 0 });
    }

    // Get event name
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    if (!event) {
      return successResponse({ purchases: [], total: 0 });
    }

    // Find movements that mention this event
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        type: "SALE",
        notes: {
          contains: event.name,
        },
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by participant name in notes
    const filteredMovements = movements.filter(
      (m) => m.notes?.includes(participantName)
    );

    const purchases = filteredMovements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      quantity: Math.abs(m.quantity),
      unitPrice: Number(m.unitPrice),
      total: Number(m.totalAmount),
      date: m.createdAt,
    }));

    const total = purchases.reduce((sum, p) => sum + p.total, 0);

    return successResponse({ purchases, total });
  } catch (error) {
    return handleApiError(error, "fetching participant purchases");
  }
}
