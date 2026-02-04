import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
  createdResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";
import { createBabyCardSchema } from "@/lib/validations/baby-card";

/**
 * GET /api/baby-cards
 * List all baby card templates
 */
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const filters = {
      isActive: isActive !== null ? isActive === "true" : undefined,
      search: search || undefined,
    };

    const babyCards = await babyCardService.getAll(filters);

    // Serialize Decimal fields
    const serialized = babyCards.map((card) => ({
      ...card,
      price: Number(card.price),
      firstSessionDiscount: Number(card.firstSessionDiscount),
      specialPrices: card.specialPrices.map((sp) => ({
        ...sp,
        specialPrice: Number(sp.specialPrice),
        package: sp.package
          ? { ...sp.package, basePrice: Number(sp.package.basePrice) }
          : null,
      })),
    }));

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching baby cards");
  }
}

/**
 * POST /api/baby-cards
 * Create a new baby card template
 */
export async function POST(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const body = await request.json();
    const data = validateRequest(body, createBabyCardSchema);

    const babyCard = await babyCardService.create(data);

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

    return createdResponse(serialized);
  } catch (error) {
    return handleApiError(error, "creating baby card");
  }
}
