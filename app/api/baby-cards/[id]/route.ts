import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";
import { updateBabyCardSchema } from "@/lib/validations/baby-card";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/baby-cards/[id]
 * Get a single baby card template with details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id } = await params;
    const babyCard = await babyCardService.getById(id);

    // Serialize Decimal fields
    const serialized = {
      ...babyCard,
      price: Number(babyCard.price),
      firstSessionDiscount: Number(babyCard.firstSessionDiscount),
      specialPrices: babyCard.specialPrices.map((sp) => ({
        ...sp,
        specialPrice: Number(sp.specialPrice),
        package: sp.package
          ? { ...sp.package, basePrice: Number(sp.package.basePrice) }
          : null,
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching baby card");
  }
}

/**
 * PUT /api/baby-cards/[id]
 * Update a baby card template
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const data = validateRequest(body, updateBabyCardSchema);

    let babyCard;
    try {
      babyCard = await babyCardService.update(id, data);
    } catch (serviceError) {
      if (serviceError instanceof Error && serviceError.message === "REWARD_HAS_USAGES_CANNOT_DELETE") {
        return NextResponse.json(
          { error: "REWARD_HAS_USAGES_CANNOT_DELETE" },
          { status: 400 }
        );
      }
      throw serviceError;
    }

    // Serialize Decimal fields
    const serialized = {
      ...babyCard,
      price: Number(babyCard.price),
      firstSessionDiscount: Number(babyCard.firstSessionDiscount),
      specialPrices: babyCard.specialPrices.map((sp) => ({
        ...sp,
        specialPrice: Number(sp.specialPrice),
        package: sp.package
          ? { ...sp.package, basePrice: Number(sp.package.basePrice) }
          : null,
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "updating baby card");
  }
}

/**
 * DELETE /api/baby-cards/[id]
 * Delete a baby card template (only if no purchases)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    await babyCardService.delete(id);

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error, "deleting baby card");
  }
}
