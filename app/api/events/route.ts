import { NextRequest, NextResponse } from "next/server";
import { withAuth, validateRequest, handleApiError, createdResponse, successResponse } from "@/lib/api-utils";
import { eventService } from "@/lib/services/event-service";
import { createEventSchema, eventFiltersSchema } from "@/lib/validations/event";

// GET /api/events - Get all events with filters
export async function GET(request: NextRequest) {
  try {
    await withAuth(["ADMIN", "RECEPTION", "THERAPIST"]);

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validatedFilters = validateRequest(filters, eventFiltersSchema);
    const events = await eventService.getAll(validatedFilters);

    return successResponse({ events });
  } catch (error) {
    return handleApiError(error, "fetching events");
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["ADMIN", "RECEPTION"]);

    const body = await request.json();
    const data = validateRequest(body, createEventSchema);

    const event = await eventService.create({
      ...data,
      createdById: session.user.id,
    });

    return createdResponse({ event });
  } catch (error) {
    return handleApiError(error, "creating event");
  }
}
