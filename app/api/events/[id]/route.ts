import { NextRequest } from "next/server";
import { withAuth, validateRequest, handleApiError, successResponse } from "@/lib/api-utils";
import { eventService } from "@/lib/services/event-service";
import { updateEventSchema } from "@/lib/validations/event";

// GET /api/events/[id] - Get event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { id } = await params;
    const event = await eventService.getById(id);

    return successResponse({ event });
  } catch (error) {
    return handleApiError(error, "fetching event");
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();
    const data = validateRequest(body, updateEventSchema);

    const event = await eventService.update(id, data);

    return successResponse({ event });
  } catch (error) {
    return handleApiError(error, "updating event");
  }
}

// DELETE /api/events/[id] - Delete event (only DRAFT)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    await eventService.delete(id);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "deleting event");
  }
}
