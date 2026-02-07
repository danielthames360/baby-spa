import { NextRequest, NextResponse } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse, requireOpenCashRegister } from "@/lib/api-utils";
import { eventParticipantService } from "@/lib/services/event-participant-service";
import { updateParticipantSchema, registerPaymentSchema, markAttendanceSchema } from "@/lib/validations/event";

// GET /api/events/[id]/participants/[participantId] - Get participant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

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
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { participantId } = await params;
    const body = await request.json();

    // Check if this is a payment registration (supports both legacy single method and split payments)
    if (body.amount !== undefined && (body.paymentMethod !== undefined || body.paymentDetails !== undefined)) {
      // Enforce cash register for RECEPTION when processing payments
      const cashRegisterId = await requireOpenCashRegister(session.user.id, session.user.role);
      if (session.user.role === "RECEPTION" && !cashRegisterId) {
        return NextResponse.json(
          { error: "CASH_REGISTER_REQUIRED", message: "Cash register must be open to process payments" },
          { status: 400 }
        );
      }

      const data = validateRequest(body, registerPaymentSchema);
      const participant = await eventParticipantService.registerPayment({
        participantId,
        ...data,
        registeredById: session.user.id,
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
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { participantId } = await params;
    await eventParticipantService.remove(participantId);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "removing participant");
  }
}
