import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse } from "@/lib/api-utils";
import { eventParticipantService } from "@/lib/services/event-participant-service";
import { updateParticipantSchema, registerPaymentSchema, markAttendanceSchema } from "@/lib/validations/event";

// GET /api/events/[id]/participants/[participantId] - Get participant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["ADMIN", "RECEPTION", "THERAPIST"]);

    const { participantId } = await params;
    const participant = await eventParticipantService.getById(participantId);

    return successResponse({ participant });
  } catch (error) {
    return handleApiError(error, "fetching participant");
  }
}

// PUT /api/events/[id]/participants/[participantId] - Update participant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["ADMIN", "RECEPTION"]);

    const { participantId } = await params;
    const body = await request.json();

    // Check if this is a payment registration
    if (body.paymentMethod !== undefined && body.amount !== undefined) {
      const data = validateRequest(body, registerPaymentSchema);
      const participant = await eventParticipantService.registerPayment({
        participantId,
        ...data,
      });
      return successResponse({ participant });
    }

    // Check if this is attendance marking
    if (body.attended !== undefined && Object.keys(body).length === 1) {
      const { attended } = validateRequest(body, markAttendanceSchema);
      const participant = await eventParticipantService.markAttendance(participantId, attended);
      return successResponse({ participant });
    }

    // Regular update
    const data = validateRequest(body, updateParticipantSchema);
    const participant = await eventParticipantService.update(participantId, data);

    return successResponse({ participant });
  } catch (error) {
    return handleApiError(error, "updating participant");
  }
}

// DELETE /api/events/[id]/participants/[participantId] - Remove participant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["ADMIN", "RECEPTION"]);

    const { participantId } = await params;
    await eventParticipantService.remove(participantId);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "removing participant");
  }
}
