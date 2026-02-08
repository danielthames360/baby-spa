import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

// GET /api/events/[id]/participants-with-purchases - Get participant IDs that have purchases
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id: eventId } = await params;

    // Get event with participants (both babies and parents)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        participants: {
          select: {
            id: true,
            baby: { select: { name: true } },
            parent: { select: { name: true } },
          },
        },
      },
    });

    if (!event) {
      return successResponse({ participantIds: [] });
    }

    // Get all SALE movements for this event
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        type: "SALE",
        notes: { contains: event.name },
      },
      select: { notes: true },
    });

    // Find which participants have purchases by matching names in notes
    const participantsWithPurchases: string[] = [];

    for (const participant of event.participants) {
      const participantName = participant.baby?.name || participant.parent?.name;
      if (participantName) {
        const hasPurchase = movements.some((m) => m.notes?.includes(participantName));
        if (hasPurchase) {
          participantsWithPurchases.push(participant.id);
        }
      }
    }

    return successResponse({ participantIds: participantsWithPurchases });
  } catch (error) {
    return handleApiError(error, "fetching participants with purchases");
  }
}
