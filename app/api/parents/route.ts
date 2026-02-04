import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  handleApiError,
  validateRequest,
  createdResponse,
  successResponse,
} from "@/lib/api-utils";
import { parentService } from "@/lib/services/parent-service";
import { parentWithLeadSchema, parentListFiltersSchema } from "@/lib/validations/baby";

// GET /api/parents - List parents with filters
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);
    const params = validateRequest(
      {
        search: searchParams.get("search") || undefined,
        status: searchParams.get("status") || "all",
        page: searchParams.get("page") || 1,
        limit: searchParams.get("limit") || 10,
      },
      parentListFiltersSchema
    );

    const result = await parentService.list(params);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "listing parents");
  }
}

// POST /api/parents - Create parent/lead
export async function POST(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const body = await request.json();
    const validatedData = validateRequest(body, parentWithLeadSchema);

    const parent = await parentService.create({
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email || undefined,
      birthDate: validatedData.birthDate ?? undefined,
      status: validatedData.status as "LEAD" | "ACTIVE" | "INACTIVE" | undefined,
      pregnancyWeeks: validatedData.pregnancyWeeks ?? undefined,
      leadSource: validatedData.leadSource ?? undefined,
      leadNotes: validatedData.leadNotes ?? undefined,
    });

    return createdResponse({ parent });
  } catch (error) {
    return handleApiError(error, "creating parent");
  }
}
