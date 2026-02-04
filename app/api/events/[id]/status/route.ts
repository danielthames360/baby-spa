import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse } from "@/lib/api-utils";
import { eventService } from "@/lib/services/event-service";
import { updateEventStatusSchema } from "@/lib/validations/event";

// PUT /api/events/[id]/status - Update event status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();
    const { status } = validateRequest(body, updateEventStatusSchema);

    const event = await eventService.updateStatus(id, status);

    return successResponse({ event });
  } catch (error) {
    return handleApiError(error, "updating event status");
  }
}
