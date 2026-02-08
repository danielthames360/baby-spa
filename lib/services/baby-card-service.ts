import { prisma } from "@/lib/db";
import { Prisma, BabyCardStatus, RewardType, PaymentMethod } from "@prisma/client";
import { transactionService, PaymentMethodEntry } from "./transaction-service";
import { activityService } from "./activity-service";

// Payment detail input type for split payments (legacy, maps to PaymentMethodEntry)
interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

// ============================================================
// TYPES
// ============================================================

interface CreateBabyCardInput {
  name: string;
  description?: string | null;
  price: number;
  totalSessions: number;
  firstSessionDiscount?: number;
  isActive?: boolean;
  sortOrder?: number;
  specialPrices?: {
    packageId: string;
    specialPrice: number;
  }[];
  rewards?: {
    sessionNumber: number;
    rewardType: RewardType;
    packageId?: string | null;
    productId?: string | null;
    customName?: string | null;
    customDescription?: string | null;
    displayName: string;
    displayIcon?: string | null;
  }[];
}

interface UpdateBabyCardInput {
  name?: string;
  description?: string | null;
  price?: number;
  totalSessions?: number;
  firstSessionDiscount?: number;
  isActive?: boolean;
  sortOrder?: number;
  specialPrices?: {
    id?: string;
    packageId: string;
    specialPrice: number;
  }[];
  rewards?: {
    id?: string;
    sessionNumber: number;
    rewardType: RewardType;
    packageId?: string | null;
    productId?: string | null;
    customName?: string | null;
    customDescription?: string | null;
    displayName: string;
    displayIcon?: string | null;
  }[];
}

interface PurchaseBabyCardInput {
  babyCardId: string;
  babyId: string;
  pricePaid: number;
  paymentMethod?: PaymentMethod | null; // Legacy single method
  paymentReference?: string | null;
  paymentDetails?: PaymentDetailInput[]; // NEW: Split payment support
  createdById: string;
}

interface UseRewardInput {
  purchaseId: string;
  rewardId: string;
  usedById: string;
  appointmentId?: string | null;
  eventParticipantId?: string | null;
  productSaleId?: string | null;
  notes?: string | null;
}

interface BabyCardFilters {
  isActive?: boolean;
  search?: string;
}

// ============================================================
// INCLUDES
// ============================================================

const babyCardInclude = {
  specialPrices: {
    include: {
      package: {
        select: { id: true, name: true, basePrice: true },
      },
    },
    orderBy: { specialPrice: "asc" as const },
  },
  rewards: {
    include: {
      package: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
    orderBy: { sessionNumber: "asc" as const },
  },
  _count: {
    select: { purchases: true },
  },
} satisfies Prisma.BabyCardInclude;

const purchaseInclude = {
  babyCard: {
    include: {
      specialPrices: {
        include: {
          package: { select: { id: true, name: true, basePrice: true } },
        },
      },
      rewards: {
        include: {
          package: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { sessionNumber: "asc" as const },
      },
    },
  },
  baby: {
    select: { id: true, name: true, birthDate: true },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  rewardUsages: {
    include: {
      babyCardReward: true,
      usedBy: { select: { id: true, name: true } },
    },
    orderBy: { usedAt: "desc" as const },
  },
  sessionLogs: {
    include: {
      session: {
        include: {
          appointment: {
            select: { id: true, date: true, startTime: true },
          },
        },
      },
    },
    orderBy: { sessionNumber: "desc" as const },
  },
} satisfies Prisma.BabyCardPurchaseInclude;

// ============================================================
// SERVICE
// ============================================================

export const babyCardService = {
  // ============================================================
  // TEMPLATES (BabyCard CRUD)
  // ============================================================

  /**
   * Get all baby card templates
   */
  async getAll(filters?: BabyCardFilters) {
    const where: Prisma.BabyCardWhereInput = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.babyCard.findMany({
      where,
      include: babyCardInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  /**
   * Get baby card template by ID
   */
  async getById(id: string) {
    const babyCard = await prisma.babyCard.findUnique({
      where: { id },
      include: babyCardInclude,
    });

    if (!babyCard) {
      throw new Error("BABY_CARD_NOT_FOUND");
    }

    return babyCard;
  },

  /**
   * Create a new baby card template
   */
  async create(input: CreateBabyCardInput) {
    return prisma.babyCard.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        totalSessions: input.totalSessions,
        firstSessionDiscount: input.firstSessionDiscount ?? 0,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        specialPrices: input.specialPrices?.length
          ? {
              create: input.specialPrices.map((sp) => ({
                packageId: sp.packageId,
                specialPrice: sp.specialPrice,
              })),
            }
          : undefined,
        rewards: input.rewards?.length
          ? {
              create: input.rewards.map((r) => ({
                sessionNumber: r.sessionNumber,
                rewardType: r.rewardType,
                packageId: r.packageId,
                productId: r.productId,
                customName: r.customName,
                customDescription: r.customDescription,
                displayName: r.displayName,
                displayIcon: r.displayIcon,
              })),
            }
          : undefined,
      },
      include: babyCardInclude,
    });
  },

  /**
   * Update a baby card template
   */
  async update(id: string, input: UpdateBabyCardInput) {
    const existing = await prisma.babyCard.findUnique({
      where: { id },
      include: { specialPrices: true, rewards: true },
    });

    if (!existing) {
      throw new Error("BABY_CARD_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      // Update basic fields
      const updateData: Prisma.BabyCardUpdateInput = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.totalSessions !== undefined) updateData.totalSessions = input.totalSessions;
      if (input.firstSessionDiscount !== undefined) updateData.firstSessionDiscount = input.firstSessionDiscount;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

      // Handle special prices: delete all and recreate
      if (input.specialPrices !== undefined) {
        await tx.babyCardSpecialPrice.deleteMany({
          where: { babyCardId: id },
        });

        if (input.specialPrices.length > 0) {
          await tx.babyCardSpecialPrice.createMany({
            data: input.specialPrices.map((sp) => ({
              babyCardId: id,
              packageId: sp.packageId,
              specialPrice: sp.specialPrice,
            })),
          });
        }
      }

      // Handle rewards: smart update based on usage history
      if (input.rewards !== undefined) {
        // Get existing rewards with their usage count
        const existingRewards = await tx.babyCardReward.findMany({
          where: { babyCardId: id },
          include: {
            _count: { select: { usages: true } },
          },
        });

        // Separate rewards that have been used (protected) vs unused (can be modified)
        const protectedRewards = existingRewards.filter((r) => r._count.usages > 0);
        const editableRewards = existingRewards.filter((r) => r._count.usages === 0);

        // Check if trying to remove or modify a protected reward
        for (const protectedReward of protectedRewards) {
          const inputReward = input.rewards.find((r) => r.sessionNumber === protectedReward.sessionNumber);
          if (!inputReward) {
            // Trying to remove a protected reward
            throw new Error("REWARD_HAS_USAGES_CANNOT_DELETE");
          }
          // Note: We allow the same session number but will keep the original reward data
        }

        // Delete only editable rewards (those without usages)
        const editableRewardIds = editableRewards.map((r) => r.id);
        if (editableRewardIds.length > 0) {
          await tx.babyCardReward.deleteMany({
            where: { id: { in: editableRewardIds } },
          });
        }

        // Get session numbers that are protected (cannot be overwritten)
        const protectedSessionNumbers = new Set(protectedRewards.map((r) => r.sessionNumber));

        // Create only new rewards that don't conflict with protected ones
        const newRewards = input.rewards.filter(
          (r) => !protectedSessionNumbers.has(r.sessionNumber)
        );

        if (newRewards.length > 0) {
          await tx.babyCardReward.createMany({
            data: newRewards.map((r) => ({
              babyCardId: id,
              sessionNumber: r.sessionNumber,
              rewardType: r.rewardType,
              packageId: r.packageId,
              productId: r.productId,
              customName: r.customName,
              customDescription: r.customDescription,
              displayName: r.displayName,
              displayIcon: r.displayIcon,
            })),
          });
        }
      }

      return tx.babyCard.update({
        where: { id },
        data: updateData,
        include: babyCardInclude,
      });
    });
  },

  /**
   * Delete a baby card template (only if no purchases)
   */
  async delete(id: string) {
    const babyCard = await prisma.babyCard.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } },
    });

    if (!babyCard) {
      throw new Error("BABY_CARD_NOT_FOUND");
    }

    if (babyCard._count.purchases > 0) {
      throw new Error("BABY_CARD_HAS_PURCHASES");
    }

    return prisma.babyCard.delete({
      where: { id },
    });
  },

  // ============================================================
  // PURCHASES
  // ============================================================

  /**
   * Purchase a baby card for a baby
   */
  async purchaseCard(input: PurchaseBabyCardInput) {
    const [babyCard, baby, existingPurchase] = await Promise.all([
      prisma.babyCard.findUnique({ where: { id: input.babyCardId } }),
      prisma.baby.findUnique({ where: { id: input.babyId } }),
      prisma.babyCardPurchase.findFirst({
        where: { babyId: input.babyId, status: "ACTIVE" },
      }),
    ]);

    if (!babyCard) {
      throw new Error("BABY_CARD_NOT_FOUND");
    }

    if (!babyCard.isActive) {
      throw new Error("BABY_CARD_NOT_ACTIVE");
    }

    if (!baby) {
      throw new Error("BABY_NOT_FOUND");
    }

    const result = await prisma.$transaction(async (tx) => {
      // If baby has existing active card, mark it as replaced
      if (existingPurchase) {
        await tx.babyCardPurchase.update({
          where: { id: existingPurchase.id },
          data: {
            status: "REPLACED",
            replacedDate: new Date(),
          },
        });
      }

      // Normalize payment methods for transaction
      const paymentMethods: PaymentMethodEntry[] = input.paymentDetails?.length
        ? input.paymentDetails.map((pd) => ({
            method: pd.paymentMethod,
            amount: pd.amount,
            reference: pd.reference ?? undefined,
          }))
        : input.paymentMethod
        ? [
            {
              method: input.paymentMethod,
              amount: input.pricePaid,
              reference: input.paymentReference ?? undefined,
            },
          ]
        : [];

      // Use the first payment method as the "primary" method for backwards compatibility
      const primaryMethod = paymentMethods.length > 0
        ? paymentMethods[0].method
        : input.paymentMethod;
      const primaryReference = paymentMethods.length > 0
        ? paymentMethods[0].reference
        : input.paymentReference;

      // Create new purchase
      const purchase = await tx.babyCardPurchase.create({
        data: {
          babyCardId: input.babyCardId,
          babyId: input.babyId,
          pricePaid: input.pricePaid,
          paymentMethod: primaryMethod,
          paymentReference: primaryReference,
          createdById: input.createdById,
          status: "ACTIVE",
        },
        include: purchaseInclude,
      });

      // Update the replaced card to reference the new one
      if (existingPurchase) {
        await tx.babyCardPurchase.update({
          where: { id: existingPurchase.id },
          data: { replacedByPurchaseId: purchase.id },
        });
      }

      return { purchase, babyName: baby.name, cardName: babyCard.name, paymentMethods };
    });

    // Create transaction record for split payment tracking (outside of prisma transaction)
    if (result.paymentMethods.length > 0 && input.pricePaid > 0) {
      try {
        await transactionService.create({
          type: "INCOME",
          category: "BABY_CARD",
          referenceType: "BabyCardPurchase",
          referenceId: result.purchase.id,
          items: [
            {
              itemType: "BABY_CARD",
              description: result.cardName,
              unitPrice: input.pricePaid,
            },
          ],
          paymentMethods: result.paymentMethods,
          createdById: input.createdById,
        });
      } catch (error) {
        console.error("Error creating transaction for baby card purchase:", error);
      }
    }

    // Log activity for sold baby card
    try {
      await activityService.logBabyCardSold(result.purchase.id, {
        babyName: result.babyName,
        cardName: result.cardName,
        pricePaid: input.pricePaid,
      }, input.createdById);
    } catch (error) {
      console.error("Error logging baby card sold activity:", error);
    }

    return result.purchase;
  },

  /**
   * Get active purchase for a baby
   */
  async getActivePurchaseByBaby(babyId: string) {
    return prisma.babyCardPurchase.findFirst({
      where: { babyId, status: "ACTIVE" },
      include: purchaseInclude,
    });
  },

  /**
   * Get all purchases for a baby (including history)
   */
  async getAllPurchasesByBaby(babyId: string) {
    return prisma.babyCardPurchase.findMany({
      where: { babyId },
      include: purchaseInclude,
      orderBy: { purchaseDate: "desc" },
    });
  },

  /**
   * Get purchase by ID
   */
  async getPurchaseById(id: string) {
    const purchase = await prisma.babyCardPurchase.findUnique({
      where: { id },
      include: purchaseInclude,
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    return purchase;
  },

  /**
   * Get all purchases with filters
   */
  async getAllPurchases(filters?: {
    status?: BabyCardStatus;
    babyId?: string;
    babyCardId?: string;
  }) {
    const where: Prisma.BabyCardPurchaseWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.babyId) where.babyId = filters.babyId;
    if (filters?.babyCardId) where.babyCardId = filters.babyCardId;

    return prisma.babyCardPurchase.findMany({
      where,
      include: purchaseInclude,
      orderBy: { purchaseDate: "desc" },
    });
  },

  // ============================================================
  // PROGRESS (called from session-service)
  // ============================================================

  /**
   * Increment session count when a session is completed
   * Returns info about newly unlocked rewards
   */
  async incrementSessionCount(babyId: string, sessionId: string) {
    const purchase = await prisma.babyCardPurchase.findFirst({
      where: { babyId, status: "ACTIVE" },
      include: {
        babyCard: {
          include: { rewards: { orderBy: { sessionNumber: "asc" } } },
        },
        rewardUsages: true,
      },
    });

    if (!purchase) {
      return { purchase: null, newRewards: [] };
    }

    // Check if session already logged
    const existingLog = await prisma.babyCardSessionLog.findUnique({
      where: { sessionId },
    });

    if (existingLog) {
      return { purchase, newRewards: [] };
    }

    const newSessionNumber = purchase.completedSessions + 1;
    const isCompleted = newSessionNumber >= purchase.babyCard.totalSessions;

    // Update purchase and create session log in transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Create session log
      await tx.babyCardSessionLog.create({
        data: {
          babyCardPurchaseId: purchase.id,
          sessionId,
          sessionNumber: newSessionNumber,
        },
      });

      // Update purchase
      return tx.babyCardPurchase.update({
        where: { id: purchase.id },
        data: {
          completedSessions: newSessionNumber,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          completedDate: isCompleted ? new Date() : null,
        },
        include: purchaseInclude,
      });
    });

    // Check for rewards that will be available in the NEXT session
    // After completing this session, rewards with sessionNumber <= newSessionNumber + 1 are available
    // So the "new" reward that just became available for NEXT session is sessionNumber === newSessionNumber + 1
    const usedRewardIds = new Set(purchase.rewardUsages.map((u) => u.babyCardRewardId));
    const newRewards = purchase.babyCard.rewards.filter(
      (r) => r.sessionNumber === newSessionNumber + 1 && !usedRewardIds.has(r.id)
    );

    return { purchase: updatedPurchase, newRewards };
  },

  /**
   * Check which rewards are available (unlocked but not used)
   */
  async getAvailableRewards(purchaseId: string) {
    const purchase = await prisma.babyCardPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        babyCard: {
          include: {
            rewards: {
              include: {
                package: { select: { id: true, name: true, basePrice: true } },
                product: { select: { id: true, name: true, salePrice: true } },
              },
              orderBy: { sessionNumber: "asc" },
            },
          },
        },
        rewardUsages: true,
      },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    const usedRewardIds = new Set(purchase.rewardUsages.map((u) => u.babyCardRewardId));

    // Reward unlocks when completed sessions reaches sessionNumber - 1
    // (available to use IN that session, not after completing it)
    return purchase.babyCard.rewards
      .filter(
        (r) =>
          r.sessionNumber <= purchase.completedSessions + 1 && !usedRewardIds.has(r.id)
      )
      .map((r) => ({
        ...r,
        isAvailable: true,
        isUsed: false,
      }));
  },

  /**
   * Get all rewards with their status (locked, available, used)
   */
  async getRewardsWithStatus(purchaseId: string) {
    const purchase = await prisma.babyCardPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        babyCard: {
          include: {
            rewards: {
              include: {
                package: { select: { id: true, name: true, basePrice: true } },
                product: { select: { id: true, name: true, salePrice: true } },
                usages: {
                  where: { babyCardPurchaseId: purchaseId },
                  include: {
                    usedBy: { select: { id: true, name: true } },
                  },
                },
              },
              orderBy: { sessionNumber: "asc" },
            },
          },
        },
      },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    // Reward unlocks when completed sessions reaches sessionNumber - 1
    // (available to use IN that session, not after completing it)
    return purchase.babyCard.rewards.map((r) => {
      const usage = r.usages[0];
      const isUnlocked = r.sessionNumber <= purchase.completedSessions + 1;
      const isUsed = !!usage;

      return {
        ...r,
        status: isUsed ? "USED" : isUnlocked ? "AVAILABLE" : "LOCKED",
        isUnlocked,
        isAvailable: isUnlocked && !isUsed,
        isUsed,
        usage,
        sessionsUntilUnlock: Math.max(0, r.sessionNumber - 1 - purchase.completedSessions),
        progressPercent: Math.min(100, ((purchase.completedSessions + 1) / r.sessionNumber) * 100),
      };
    });
  },

  // ============================================================
  // REWARDS USAGE
  // ============================================================

  /**
   * Use a reward
   */
  async useReward(input: UseRewardInput) {
    const [purchase, reward] = await Promise.all([
      prisma.babyCardPurchase.findUnique({
        where: { id: input.purchaseId },
        include: {
          rewardUsages: true,
          baby: { select: { name: true } },
          babyCard: { select: { name: true } },
        },
      }),
      prisma.babyCardReward.findUnique({
        where: { id: input.rewardId },
      }),
    ]);

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    if (!reward) {
      throw new Error("REWARD_NOT_FOUND");
    }

    // Verify reward belongs to this purchase's baby card
    if (reward.babyCardId !== purchase.babyCardId) {
      throw new Error("REWARD_NOT_VALID_FOR_PURCHASE");
    }

    // Verify reward is unlocked (available to use IN that session)
    if (reward.sessionNumber > purchase.completedSessions + 1) {
      throw new Error("REWARD_NOT_UNLOCKED");
    }

    // Verify reward hasn't been used
    const alreadyUsed = purchase.rewardUsages.some(
      (u) => u.babyCardRewardId === input.rewardId
    );

    if (alreadyUsed) {
      throw new Error("REWARD_ALREADY_USED");
    }

    const usage = await prisma.babyCardRewardUsage.create({
      data: {
        babyCardPurchaseId: input.purchaseId,
        babyCardRewardId: input.rewardId,
        usedById: input.usedById,
        appointmentId: input.appointmentId,
        eventParticipantId: input.eventParticipantId,
        productSaleId: input.productSaleId,
        notes: input.notes,
      },
      include: {
        babyCardReward: true,
        usedBy: { select: { id: true, name: true } },
      },
    });

    // Log activity for reward delivered
    try {
      await activityService.logBabyCardRewardDelivered(input.purchaseId, {
        babyName: purchase.baby?.name || "N/A",
        cardName: purchase.babyCard?.name || "N/A",
        rewardName: reward.displayName || undefined,
      }, input.usedById);
    } catch (error) {
      console.error("Error logging baby card reward delivered activity:", error);
    }

    return usage;
  },

  // ============================================================
  // SPECIAL PRICES
  // ============================================================

  /**
   * Get special price for a baby and package combination
   * Returns null if no special price applies
   */
  async getSpecialPriceForBaby(babyId: string, packageId: string) {
    const purchase = await prisma.babyCardPurchase.findFirst({
      where: { babyId, status: "ACTIVE" },
      include: {
        babyCard: {
          include: {
            specialPrices: {
              where: { packageId },
              include: {
                package: { select: { id: true, name: true, basePrice: true } },
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return null;
    }

    const specialPrice = purchase.babyCard.specialPrices[0];
    if (!specialPrice) {
      return null;
    }

    return {
      purchaseId: purchase.id,
      babyCardName: purchase.babyCard.name,
      packageId: specialPrice.packageId,
      packageName: specialPrice.package.name,
      normalPrice: Number(specialPrice.package.basePrice),
      specialPrice: Number(specialPrice.specialPrice),
      savings: Number(specialPrice.package.basePrice) - Number(specialPrice.specialPrice),
    };
  },

  /**
   * Apply special price if applicable, returns adjusted price info
   */
  async applySpecialPriceIfApplicable(
    babyId: string,
    packageId: string,
    originalPrice: number
  ) {
    const specialPrice = await this.getSpecialPriceForBaby(babyId, packageId);

    if (!specialPrice) {
      return {
        applied: false,
        originalPrice,
        finalPrice: originalPrice,
        discount: 0,
        babyCardInfo: null,
      };
    }

    return {
      applied: true,
      originalPrice,
      finalPrice: specialPrice.specialPrice,
      discount: specialPrice.savings,
      babyCardInfo: {
        purchaseId: specialPrice.purchaseId,
        babyCardName: specialPrice.babyCardName,
      },
    };
  },

  // ============================================================
  // CHECKOUT INFO
  // ============================================================

  /**
   * Get complete baby card info for checkout
   */
  async getBabyCardCheckoutInfo(babyId: string) {
    const purchase = await this.getActivePurchaseByBaby(babyId);

    if (!purchase) {
      return {
        hasActiveCard: false,
        purchase: null,
        firstSessionDiscount: null,
        availableRewards: [],
        nextReward: null,
        specialPrices: [],
      };
    }

    const [rewardsWithStatus, availableRewards] = await Promise.all([
      this.getRewardsWithStatus(purchase.id),
      this.getAvailableRewards(purchase.id),
    ]);

    // Find next reward (first locked one)
    const nextReward = rewardsWithStatus.find((r) => r.status === "LOCKED");

    // First session discount info
    const firstSessionDiscount = Number(purchase.babyCard.firstSessionDiscount);
    const hasFirstSessionDiscount = firstSessionDiscount > 0 && !purchase.firstSessionDiscountUsed;

    return {
      hasActiveCard: true,
      purchase: {
        id: purchase.id,
        babyCardName: purchase.babyCard.name,
        completedSessions: purchase.completedSessions,
        totalSessions: purchase.babyCard.totalSessions,
        progressPercent: (purchase.completedSessions / purchase.babyCard.totalSessions) * 100,
        status: purchase.status,
      },
      // First session discount
      firstSessionDiscount: hasFirstSessionDiscount
        ? {
            amount: firstSessionDiscount,
            used: false,
          }
        : purchase.firstSessionDiscountUsed
        ? {
            amount: Number(purchase.firstSessionDiscountAmount) || 0,
            used: true,
          }
        : null,
      availableRewards: availableRewards.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        displayIcon: r.displayIcon,
        rewardType: r.rewardType,
        sessionNumber: r.sessionNumber,
        package: r.package,
        product: r.product,
      })),
      nextReward: nextReward
        ? {
            id: nextReward.id,
            displayName: nextReward.displayName,
            displayIcon: nextReward.displayIcon,
            sessionNumber: nextReward.sessionNumber,
            sessionsUntilUnlock: nextReward.sessionsUntilUnlock,
          }
        : null,
      specialPrices: purchase.babyCard.specialPrices.map((sp) => ({
        packageId: sp.package.id,
        packageName: sp.package.name,
        normalPrice: Number(sp.package.basePrice),
        specialPrice: Number(sp.specialPrice),
      })),
    };
  },

  // ============================================================
  // FIRST SESSION DISCOUNT
  // ============================================================

  /**
   * Apply first session discount
   * Returns the actual amount discounted (may be less than configured if service costs less)
   */
  async applyFirstSessionDiscount(
    purchaseId: string,
    appliedToId: string,
    servicePrice: number
  ) {
    const purchase = await prisma.babyCardPurchase.findUnique({
      where: { id: purchaseId },
      include: { babyCard: true },
    });

    if (!purchase) {
      throw new Error("PURCHASE_NOT_FOUND");
    }

    const discountConfigured = Number(purchase.babyCard.firstSessionDiscount);
    if (discountConfigured <= 0) {
      throw new Error("BABY_CARD_NO_DISCOUNT");
    }

    if (purchase.firstSessionDiscountUsed) {
      throw new Error("FIRST_SESSION_DISCOUNT_ALREADY_USED");
    }

    // Calculate actual discount (can't exceed service price)
    const actualDiscount = Math.min(discountConfigured, servicePrice);

    const updated = await prisma.babyCardPurchase.update({
      where: { id: purchaseId },
      data: {
        firstSessionDiscountUsed: true,
        firstSessionDiscountAmount: actualDiscount,
        firstSessionDiscountAppliedTo: appliedToId,
        firstSessionDiscountDate: new Date(),
      },
      include: purchaseInclude,
    });

    return {
      purchase: updated,
      discountApplied: actualDiscount,
      originalPrice: servicePrice,
      finalPrice: servicePrice - actualDiscount,
    };
  },

  /**
   * Get first session discount info for a baby
   */
  async getFirstSessionDiscountInfo(babyId: string) {
    const purchase = await this.getActivePurchaseByBaby(babyId);

    if (!purchase) {
      return { hasDiscount: false, reason: "NO_ACTIVE_CARD" };
    }

    const discountAmount = Number(purchase.babyCard.firstSessionDiscount);
    if (discountAmount <= 0) {
      return { hasDiscount: false, reason: "CARD_NO_DISCOUNT" };
    }

    if (purchase.firstSessionDiscountUsed) {
      return { hasDiscount: false, reason: "ALREADY_USED" };
    }

    return {
      hasDiscount: true,
      purchaseId: purchase.id,
      discountAmount,
      babyCardName: purchase.babyCard.name,
    };
  },

  /**
   * Increment session count for package purchases
   * Used when buying a package to add multiple sessions at once
   */
  async incrementSessionCountByAmount(babyId: string, sessionsToAdd: number) {
    const purchase = await prisma.babyCardPurchase.findFirst({
      where: { babyId, status: "ACTIVE" },
      include: {
        babyCard: {
          include: { rewards: { orderBy: { sessionNumber: "asc" } } },
        },
        rewardUsages: true,
      },
    });

    if (!purchase) {
      return { purchase: null, newRewards: [] };
    }

    const newCompletedSessions = purchase.completedSessions + sessionsToAdd;
    const isCompleted = newCompletedSessions >= purchase.babyCard.totalSessions;

    // Update purchase
    const updatedPurchase = await prisma.babyCardPurchase.update({
      where: { id: purchase.id },
      data: {
        completedSessions: newCompletedSessions,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        completedDate: isCompleted ? new Date() : null,
      },
      include: purchaseInclude,
    });

    // Find all rewards that are now unlocked (available for use in next session)
    const usedRewardIds = new Set(purchase.rewardUsages.map((u) => u.babyCardRewardId));
    const previouslyUnlockedMax = purchase.completedSessions + 1;
    const newUnlockedMax = newCompletedSessions + 1;

    // Rewards that just became available
    const newRewards = purchase.babyCard.rewards.filter(
      (r) =>
        r.sessionNumber > previouslyUnlockedMax &&
        r.sessionNumber <= newUnlockedMax &&
        !usedRewardIds.has(r.id)
    );

    return { purchase: updatedPurchase, newRewards };
  },
};
