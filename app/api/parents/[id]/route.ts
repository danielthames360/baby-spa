import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  validateRequest,
  successResponse,
} from "@/lib/api-utils";
import { parentService } from "@/lib/services/parent-service";
import { updateParentWithLeadSchema } from "@/lib/validations/baby";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/parents/[id] - Get parent with details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const parent = await parentService.getWithDetails(id);

    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    return successResponse({ parent });
  } catch (error) {
    return handleApiError(error, "getting parent");
  }
}

// PUT /api/parents/[id] - Update parent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const body = await request.json();
    const validatedData = validateRequest(body, updateParentWithLeadSchema);

    // Check parent exists
    const existingParent = await parentService.getById(id);
    if (!existingParent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    const parent = await parentService.update(id, {
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email ?? undefined,
      birthDate: validatedData.birthDate ?? undefined,
      status: validatedData.status as "LEAD" | "ACTIVE" | "INACTIVE" | undefined,
      pregnancyWeeks: validatedData.pregnancyWeeks ?? undefined,
      leadSource: validatedData.leadSource ?? undefined,
      leadNotes: validatedData.leadNotes ?? undefined,
    });

    return successResponse({ parent });
  } catch (error) {
    return handleApiError(error, "updating parent");
  }
}

// DELETE /api/parents/[id] - Delete parent
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;

    await parentService.delete(id);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "deleting parent");
  }
}
