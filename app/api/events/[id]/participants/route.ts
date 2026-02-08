import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse, createdResponse } from "@/lib/api-utils";
import { eventService } from "@/lib/services/event-service";
import { eventParticipantService } from "@/lib/services/event-participant-service";
import { addBabyParticipantSchema, addParentParticipantSchema } from "@/lib/validations/event";

// GET /api/events/[id]/participants - Get all participants for an event
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id } = await params;
    const participants = await eventParticipantService.getByEventId(id);

    return successResponse({ participants });
  } catch (error) {
    return handleApiError(error, "fetching participants");
  }
}

// POST /api/events/[id]/participants - Add participant to event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();

    // Get event to determine type
    const event = await eventService.getById(id);

    let participant;

    if (event.type === "BABIES") {
      const data = validateRequest(body, addBabyParticipantSchema);
      participant = await eventParticipantService.addBabyParticipant({
        eventId: id,
        ...data,
        registeredById: session.user.id,
      });
    } else {
      // PARENTS event
      const data = validateRequest(body, addParentParticipantSchema);
      participant = await eventParticipantService.addParentParticipant({
        eventId: id,
        ...data,
        registeredById: session.user.id,
      });
    }

    return createdResponse({ participant });
  } catch (error) {
    return handleApiError(error, "adding participant");
  }
}
