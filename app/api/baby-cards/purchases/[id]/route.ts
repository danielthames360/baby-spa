import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/baby-cards/purchases/[id]
 * Get a single baby card purchase with details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["ADMIN", "RECEPTION"]);

    const { id } = await params;
    const purchase = await babyCardService.getPurchaseById(id);

    // Serialize Decimal fields
    const serialized = {
      ...purchase,
      pricePaid: Number(purchase.pricePaid),
      babyCard: {
        ...purchase.babyCard,
        price: Number(purchase.babyCard.price),
        specialPrices: purchase.babyCard.specialPrices.map((sp) => ({
          ...sp,
          specialPrice: Number(sp.specialPrice),
          package: sp.package
            ? { ...sp.package, basePrice: Number(sp.package.basePrice) }
            : null,
        })),
      },
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching baby card purchase");
  }
}
