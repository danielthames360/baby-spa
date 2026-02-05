import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";

type RouteParams = { params: Promise<{ babyId: string }> };

/**
 * GET /api/baby-cards/purchases/by-baby/[babyId]
 * Get all baby card purchases for a specific baby
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { babyId } = await params;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let purchases;
    if (activeOnly) {
      const purchase = await babyCardService.getActivePurchaseByBaby(babyId);
      purchases = purchase ? [purchase] : [];
    } else {
      purchases = await babyCardService.getAllPurchasesByBaby(babyId);
    }

    // Serialize Decimal fields and calculate unlocked rewards
    const serialized = purchases.map((p) => {
      // Calculate unlocked rewards based on completed sessions
      // Reward unlocks when completed sessions reaches sessionNumber - 1
      // (available to use IN that session, not after completing it)
      const unlockedRewards = p.babyCard.rewards
        .filter((r) => r.sessionNumber <= p.completedSessions + 1)
        .map((r) => {
          // Find if this reward has been used
          const usage = p.rewardUsages?.find((u) => u.babyCardRewardId === r.id);
          return {
            id: usage?.id || `unlocked-${r.id}`,
            rewardId: r.id,
            usedAt: usage?.usedAt || null,
            reward: r,
          };
        });

      return {
        ...p,
        purchasedAt: p.purchaseDate, // Map to expected field name
        pricePaid: Number(p.pricePaid),
        unlockedRewards,
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
      };
    });

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching baby card purchases for baby");
  }
}
