import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
  createdResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";
import { purchaseBabyCardSchema } from "@/lib/validations/baby-card";

/**
 * GET /api/baby-cards/purchases
 * List all baby card purchases
 */
export async function GET(request: NextRequest) {
  try {
    await withAuth(["ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "ACTIVE" | "COMPLETED" | "REPLACED" | "CANCELLED" | null;
    const babyId = searchParams.get("babyId");
    const babyCardId = searchParams.get("babyCardId");

    const filters = {
      status: status || undefined,
      babyId: babyId || undefined,
      babyCardId: babyCardId || undefined,
    };

    const purchases = await babyCardService.getAllPurchases(filters);

    // Serialize Decimal fields
    const serialized = purchases.map((p) => ({
      ...p,
      pricePaid: Number(p.pricePaid),
      babyCard: {
        ...p.babyCard,
        price: Number(p.babyCard.price),
        specialPrices: p.babyCard.specialPrices.map((sp) => ({
          ...sp,
          specialPrice: Number(sp.specialPrice),
          package: sp.package
            ? { ...sp.package, basePrice: Number(sp.package.basePrice) }
            : null,
        })),
      },
    }));

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching baby card purchases");
  }
}

/**
 * POST /api/baby-cards/purchases
 * Purchase a baby card for a baby
 */
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["ADMIN", "RECEPTION"]);

    const body = await request.json();
    const data = validateRequest(body, purchaseBabyCardSchema);

    const purchase = await babyCardService.purchaseCard({
      babyCardId: data.babyCardId,
      babyId: data.babyId,
      pricePaid: data.pricePaid,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      createdById: session.user.id,
    });

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

    return createdResponse(serialized);
  } catch (error) {
    return handleApiError(error, "purchasing baby card");
  }
}
