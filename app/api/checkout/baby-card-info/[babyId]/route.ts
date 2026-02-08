import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";

type RouteParams = { params: Promise<{ babyId: string }> };

/**
 * GET /api/checkout/baby-card-info/[babyId]
 * Get baby card info for checkout
 * Returns: active card status, available rewards, next reward, special prices
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);

    const { babyId } = await params;
    const info = await babyCardService.getBabyCardCheckoutInfo(babyId);

    return successResponse(info);
  } catch (error) {
    return handleApiError(error, "fetching baby card checkout info");
  }
}
