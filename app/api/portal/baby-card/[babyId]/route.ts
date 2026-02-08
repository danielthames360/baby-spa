import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { babyCardService } from "@/lib/services/baby-card-service";

type RouteParams = { params: Promise<{ babyId: string }> };

/**
 * GET /api/portal/baby-card/[babyId]
 * Get baby card info for portal (parents view)
 * Validates that the parent owns this baby
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = session.user.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "Parent ID not found" }, { status: 400 });
    }

    const { babyId } = await params;

    // Verify the parent owns this baby
    const babyParent = await prisma.babyParent.findFirst({
      where: {
        babyId,
        parentId,
      },
    });

    if (!babyParent) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    // Get the baby info
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
      select: { id: true, name: true },
    });

    if (!baby) {
      return NextResponse.json({ error: "Baby not found" }, { status: 404 });
    }

    // Get the active baby card purchase with full details
    const purchase = await babyCardService.getActivePurchaseByBaby(babyId);

    if (!purchase) {
      return NextResponse.json({
        baby,
        hasActiveCard: false,
        purchase: null,
        rewards: [],
        specialPrices: [],
      });
    }

    // Get rewards with status
    const rewardsWithStatus = await babyCardService.getRewardsWithStatus(purchase.id);

    // Find next reward (first locked one)
    const nextReward = rewardsWithStatus.find((r) => r.status === "LOCKED");
    const sessionsUntilUnlock = nextReward
      ? nextReward.sessionNumber - purchase.completedSessions - 1
      : null;

    // Find reward for the NEXT session (completedSessions + 1) - for confetti
    const nextSessionNumber = purchase.completedSessions + 1;
    const rewardForNextSession = rewardsWithStatus.find(
      (r) => r.sessionNumber === nextSessionNumber && r.status !== "USED"
    );

    return NextResponse.json({
      baby,
      hasActiveCard: true,
      purchase: {
        id: purchase.id,
        babyCardName: purchase.babyCard.name,
        babyCardDescription: purchase.babyCard.description,
        completedSessions: purchase.completedSessions,
        totalSessions: purchase.babyCard.totalSessions,
        progressPercent: (purchase.completedSessions / purchase.babyCard.totalSessions) * 100,
        firstSessionDiscount: Number(purchase.babyCard.firstSessionDiscount),
        firstSessionDiscountUsed: purchase.firstSessionDiscountUsed,
        status: purchase.status,
        purchaseDate: purchase.purchaseDate,
      },
      rewards: rewardsWithStatus.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        displayIcon: r.displayIcon,
        rewardType: r.rewardType,
        sessionNumber: r.sessionNumber,
        status: r.status, // "AVAILABLE", "USED", "LOCKED"
        usedAt: r.usage?.usedAt || null,
      })),
      // Next reward info for scheduling UI
      nextReward: nextReward ? {
        id: nextReward.id,
        displayName: nextReward.displayName,
        displayIcon: nextReward.displayIcon,
        sessionNumber: nextReward.sessionNumber,
        sessionsUntilUnlock: sessionsUntilUnlock ?? 0,
      } : null,
      // Reward for the next session (if any) - triggers confetti when booking
      rewardForNextSession: rewardForNextSession ? {
        id: rewardForNextSession.id,
        displayName: rewardForNextSession.displayName,
        displayIcon: rewardForNextSession.displayIcon,
        sessionNumber: rewardForNextSession.sessionNumber,
      } : null,
      specialPrices: purchase.babyCard.specialPrices.map((sp) => ({
        packageId: sp.package.id,
        packageName: sp.package.name,
        normalPrice: Number(sp.package.basePrice),
        specialPrice: Number(sp.specialPrice),
      })),
    });
  } catch (error) {
    console.error("Error fetching portal baby card:", error);
    return NextResponse.json(
      { error: "Failed to fetch baby card info" },
      { status: 500 }
    );
  }
}
