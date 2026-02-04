import { NextRequest } from "next/server";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { babyCardService } from "@/lib/services/baby-card-service";

type RouteParams = { params: Promise<{ id: string; rewardId: string }> };

/**
 * POST /api/baby-cards/purchases/[id]/rewards/[rewardId]/use
 * Use a reward from a baby card purchase
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { id: purchaseId, rewardId } = await params;
    const body = await request.json();

    const usage = await babyCardService.useReward({
      purchaseId,
      rewardId,
      usedById: session.user.id,
      appointmentId: body.appointmentId || null,
      eventParticipantId: body.eventParticipantId || null,
      productSaleId: body.productSaleId || null,
      notes: body.notes || null,
    });

    return successResponse(usage);
  } catch (error) {
    return handleApiError(error, "using baby card reward");
  }
}
