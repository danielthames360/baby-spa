import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse } from "@/lib/api-utils";
import { eventParticipantService } from "@/lib/services/event-participant-service";
import { bulkAttendanceSchema } from "@/lib/validations/event";

// PUT /api/events/[id]/participants/bulk-attendance - Mark attendance for multiple participants
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id } = await params;
    const body = await request.json();
    const { attendance } = validateRequest(body, bulkAttendanceSchema);

    await eventParticipantService.bulkMarkAttendance(id, attendance);

    // Fetch updated participants
    const participants = await eventParticipantService.getByEventId(id);

    return successResponse({ participants });
  } catch (error) {
    return handleApiError(error, "marking bulk attendance");
  }
}
