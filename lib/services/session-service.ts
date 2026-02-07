import { prisma } from "@/lib/db";
import { Prisma, PaymentMethod } from "@prisma/client";
import { inventoryService } from "./inventory-service";
import { packageService } from "./package-service";
import { babyCardService } from "./baby-card-service";
import { transactionService, PaymentMethodEntry, TransactionItemInput } from "./transaction-service";
import { activityService } from "./activity-service";
import { normalizeToUTCNoon, getStartOfDayUTC, getEndOfDayUTC, fromDateOnly } from "@/lib/utils/date-utils";

// Payment detail input type for split payments
interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

// Types for service inputs
interface StartSessionInput {
  appointmentId: string;
  therapistId: string;
  packagePurchaseId?: string | null; // PackagePurchase ID to link the session to (can be null if using default package at checkout)
  packageId?: string | null; // Catalog package ID (provisional selection, will be purchased at checkout)
  userId: string;
  userName: string;
}

interface AddProductInput {
  sessionId: string;
  productId: string;
  quantity: number;
  isChargeable: boolean;
}

interface CompleteSessionInput {
  sessionId: string;
  packageId?: string; // Package to sell (if baby has no active package)
  packagePurchaseId?: string; // Existing package purchase to use for this session
  paymentMethod?: "CASH" | "QR" | "CARD" | "TRANSFER"; // Legacy single method
  paymentNotes?: string;
  paymentDetails?: PaymentDetailInput[]; // NEW: Split payment support
  discountAmount?: number;
  discountReason?: string;
  useFirstSessionDiscount?: boolean; // Apply Baby Card first session discount
  userId: string;
  userName: string;
  cashRegisterId?: string; // Cash register ID for RECEPTION users
}

interface MarkNoShowInput {
  appointmentId: string;
  userId: string;
  userName: string;
}

interface EvaluationInput {
  sessionId: string;
  babyAgeMonths: number;
  babyWeight?: number;
  // Activities
  hydrotherapy: boolean;
  massage: boolean;
  motorStimulation: boolean;
  sensoryStimulation: boolean;
  relaxation: boolean;
  otherActivities?: string;
  // Sensory
  visualTracking?: boolean;
  eyeContact?: boolean;
  auditoryResponse?: boolean;
  // Muscle development
  muscleTone?: "LOW" | "NORMAL" | "TENSE";
  cervicalControl?: boolean;
  headUp?: boolean;
  // Milestones
  sits?: boolean;
  crawls?: boolean;
  walks?: boolean;
  // State
  mood?: "CALM" | "IRRITABLE";
  // Notes
  internalNotes?: string;
  externalNotes?: string;
}

export const sessionService = {
  /**
   * Start a session from an appointment
   * - Assign therapist
   * - Change status to IN_PROGRESS
   * - Create session record
   * - If packagePurchaseId is provided, link to that package
   * - If packagePurchaseId is null/undefined but appointment has one pre-selected, use that
   * - If both are null/undefined, package will be selected at checkout
   */
  async startSession(input: StartSessionInput) {
    const { appointmentId, therapistId, packagePurchaseId, packageId, userId, userName } = input;

    // Get appointment with baby info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        baby: true,
        session: true,
      },
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // Check for PENDING_PAYMENT status specifically
    if (appointment.status === "PENDING_PAYMENT") {
      throw new Error("APPOINTMENT_PENDING_PAYMENT");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("APPOINTMENT_NOT_SCHEDULED");
    }

    if (appointment.session) {
      throw new Error("SESSION_ALREADY_EXISTS");
    }

    // Verify therapist exists and is active
    const therapist = await prisma.user.findUnique({
      where: { id: therapistId },
    });

    if (!therapist || therapist.role !== "THERAPIST" || !therapist.isActive) {
      throw new Error("INVALID_THERAPIST");
    }

    // Determine which packagePurchaseId to use:
    // 1. If explicitly provided in input, use that
    // 2. If a catalog package (packageId) was selected, don't use any existing package
    // 3. Otherwise, use the one pre-selected in the appointment (from booking)
    // 4. If both are null, package will be selected at checkout
    const effectivePackagePurchaseId = packagePurchaseId
      ? packagePurchaseId
      : (packageId ? null : appointment.packagePurchaseId);

    // Get the selected package purchase (if any)
    let selectedPackage = null;
    let sessionNumber = 1;

    if (effectivePackagePurchaseId) {
      selectedPackage = await prisma.packagePurchase.findUnique({
        where: { id: effectivePackagePurchaseId },
      });

      if (!selectedPackage) {
        throw new Error("PACKAGE_PURCHASE_NOT_FOUND");
      }

      // Validate package ownership: either for baby or for parent
      const isParentAppointment = !appointment.babyId && appointment.parentId;
      if (isParentAppointment) {
        // For parent appointments, check parentId matches
        if (selectedPackage.parentId !== appointment.parentId) {
          throw new Error("PACKAGE_NOT_FOR_THIS_PARENT");
        }
      } else {
        // For baby appointments, check babyId matches
        if (selectedPackage.babyId !== appointment.babyId) {
          throw new Error("PACKAGE_NOT_FOR_THIS_BABY");
        }
      }

      if (selectedPackage.remainingSessions <= 0) {
        throw new Error("NO_SESSIONS_REMAINING");
      }

      sessionNumber = selectedPackage.usedSessions + 1;
    }

    // Create session and update appointment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update appointment
      // If a catalog packageId is provided (not an existing purchase), save it as selectedPackageId
      // If an existing package purchase is selected, update packagePurchaseId and clear selectedPackageId
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "IN_PROGRESS",
          therapistId,
          // Update selectedPackageId if a catalog package was chosen
          ...(packageId && !packagePurchaseId ? { selectedPackageId: packageId } : {}),
          // If using an existing purchase, update packagePurchaseId and clear selectedPackageId
          ...(packagePurchaseId ? {
            packagePurchaseId: packagePurchaseId,
            selectedPackageId: null
          } : {}),
        },
      });

      // Create session
      // Note: packagePurchaseId can be null initially, package is selected at checkout
      // Note: babyId can be null for parent-only appointments (prenatal massage, etc.)
      const session = await tx.session.create({
        data: {
          appointmentId,
          babyId: appointment.babyId ?? undefined,
          therapistId,
          packagePurchaseId: selectedPackage?.id || null,
          sessionNumber,
          status: "PENDING",
          startedAt: new Date(),
        },
        include: {
          baby: true,
          therapist: true,
          appointment: true,
        },
      });

      // Record history
      await tx.appointmentHistory.create({
        data: {
          appointmentId,
          action: "STARTED",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          newValue: {
            status: "IN_PROGRESS",
            therapistId,
            packagePurchaseId: selectedPackage?.id || null,
            selectedPackageId: packageId || null,
            hasPreselectedPackage: !!selectedPackage,
          },
        },
      });

      return { appointment: updatedAppointment, session };
    });

    return result;
  },

  /**
   * Add product to session
   */
  async addProduct(input: AddProductInput) {
    const { sessionId, productId, quantity, isChargeable } = input;

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { appointment: true },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    if (session.appointment.status === "COMPLETED") {
      throw new Error("SESSION_ALREADY_COMPLETED");
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    // Check stock
    if (product.currentStock < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Check if product already added
    const existingProduct = await prisma.sessionProduct.findFirst({
      where: { sessionId, productId },
    });

    if (existingProduct) {
      // Update quantity
      return prisma.sessionProduct.update({
        where: { id: existingProduct.id },
        data: {
          quantity: existingProduct.quantity + quantity,
          isChargeable,
        },
        include: { product: true },
      });
    }

    // Create new session product
    return prisma.sessionProduct.create({
      data: {
        sessionId,
        productId,
        quantity,
        unitPrice: product.salePrice,
        isChargeable,
      },
      include: { product: true },
    });
  },

  /**
   * Remove product from session
   */
  async removeProduct(sessionProductId: string) {
    const sessionProduct = await prisma.sessionProduct.findUnique({
      where: { id: sessionProductId },
      include: { session: { include: { appointment: true } } },
    });

    if (!sessionProduct) {
      throw new Error("SESSION_PRODUCT_NOT_FOUND");
    }

    if (sessionProduct.session.appointment.status === "COMPLETED") {
      throw new Error("SESSION_ALREADY_COMPLETED");
    }

    return prisma.sessionProduct.delete({
      where: { id: sessionProductId },
    });
  },

  /**
   * Complete session
   * - If packageId is provided: sell package and deduct 1 session
   * - If no packageId but baby has active package: deduct 1 session
   * - Deduct products from inventory
   * - Calculate total amount (products + package if sold)
   * - Record payment
   * - Reset parent noShowCount
   * - Mark as COMPLETED
   */
  async completeSession(input: CompleteSessionInput) {
    const { sessionId, packageId, packagePurchaseId, paymentMethod, paymentNotes, paymentDetails, discountAmount = 0, discountReason, useFirstSessionDiscount, userId, userName, cashRegisterId } = input;

    // Get session with all relations
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        appointment: {
          include: {
            baby: {
              include: {
                parents: {
                  where: { isPrimary: true },
                  include: { parent: true },
                },
              },
            },
            parent: true, // For parent-only appointments
          },
        },
        products: {
          include: { product: true },
        },
        packagePurchase: {
          include: { package: { select: { name: true } } },
        },
      },
    });

    // Fetch appointment with pendingSchedulePreferences if needed
    const appointmentWithPreferences = await prisma.appointment.findUnique({
      where: { id: session?.appointmentId },
      select: { pendingSchedulePreferences: true },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    if (session.appointment.status === "COMPLETED") {
      throw new Error("SESSION_ALREADY_COMPLETED");
    }

    if (session.appointment.status !== "IN_PROGRESS") {
      throw new Error("SESSION_NOT_IN_PROGRESS");
    }

    const babyId = session.appointment.babyId;

    // Determine which package to use for deduction:
    // Priority order:
    // 1. packagePurchaseId provided at checkout (user selected existing package)
    // 2. Package linked to the session (pre-selected at booking/start)
    // 3. Any active package with remaining sessions
    // 4. Or sell a new package if packageId is provided

    // If packagePurchaseId is provided, fetch that specific package purchase
    let selectedPackagePurchase = null;
    if (packagePurchaseId) {
      selectedPackagePurchase = await prisma.packagePurchase.findUnique({
        where: { id: packagePurchaseId },
        include: { package: { select: { name: true } } },
      });
      if (selectedPackagePurchase && selectedPackagePurchase.remainingSessions <= 0) {
        throw new Error("PACKAGE_NO_REMAINING_SESSIONS");
      }
    }

    const sessionPackage = selectedPackagePurchase || session.packagePurchase;
    // Only look for active baby package if this is a baby appointment
    const activePackage = !sessionPackage && babyId ? await packageService.getActivePackageForBaby(babyId) : null;
    const hasActivePackageWithSessions =
      (sessionPackage && sessionPackage.remainingSessions > 0) ||
      (activePackage && activePackage.remainingSessions > 0);

    // Calculate chargeable amount from products
    let productsAmount = new Prisma.Decimal(0);
    for (const sp of session.products) {
      if (sp.isChargeable) {
        productsAmount = productsAmount.add(
          new Prisma.Decimal(sp.unitPrice.toString()).mul(sp.quantity)
        );
      }
    }

    // Get package price if selling a new package
    // Sell if: packageId is provided AND no specific existing package was selected (packagePurchaseId)
    // This handles the case when user selects a catalog package at checkout
    let packageAmount = new Prisma.Decimal(0);
    let packageToSell = null;
    if (packageId && !packagePurchaseId) {
      packageToSell = await prisma.package.findUnique({
        where: { id: packageId },
      });
      if (packageToSell) {
        // Check for Baby Card special price if baby has active card
        let effectivePrice = new Prisma.Decimal(packageToSell.basePrice.toString());
        if (babyId) {
          const babyCardSpecialPrice = await babyCardService.getSpecialPriceForBaby(babyId, packageId);
          if (babyCardSpecialPrice) {
            effectivePrice = new Prisma.Decimal(babyCardSpecialPrice.specialPrice);
          }
        }
        packageAmount = effectivePrice;
      }
    }

    const subtotalAmount = productsAmount.add(packageAmount);

    // Check for Baby Card first session discount
    let firstSessionDiscountAmount = new Prisma.Decimal(0);
    let babyCardPurchaseIdForDiscount: string | null = null;
    if (useFirstSessionDiscount && babyId && subtotalAmount.greaterThan(0)) {
      const discountInfo = await babyCardService.getFirstSessionDiscountInfo(babyId);
      if (discountInfo.hasDiscount && discountInfo.discountAmount && discountInfo.purchaseId) {
        // Apply discount (max = subtotal)
        firstSessionDiscountAmount = Prisma.Decimal.min(
          new Prisma.Decimal(discountInfo.discountAmount),
          subtotalAmount
        );
        babyCardPurchaseIdForDiscount = discountInfo.purchaseId;
      }
    }

    const discountDecimal = new Prisma.Decimal(discountAmount);
    const totalDiscounts = discountDecimal.add(firstSessionDiscountAmount);
    let totalBeforeAdvance = subtotalAmount.sub(totalDiscounts).greaterThan(0)
      ? subtotalAmount.sub(totalDiscounts)
      : new Prisma.Decimal(0);

    // Query advance payments already made for this appointment (exclude voided and reversals)
    const advanceTransactions = await transactionService.getByReference("Appointment", session.appointmentId);
    let advancePaidAmount = new Prisma.Decimal(0);
    for (const t of advanceTransactions) {
      if (t.category === "APPOINTMENT_ADVANCE" && !t.isReversal && !t.voidedAt) {
        advancePaidAmount = advancePaidAmount.add(t.total);
      }
    }

    // Deduct advance from total amount to charge
    const totalAmount = advancePaidAmount.greaterThan(0)
      ? (totalBeforeAdvance.sub(advancePaidAmount).greaterThan(0)
          ? totalBeforeAdvance.sub(advancePaidAmount)
          : new Prisma.Decimal(0))
      : totalBeforeAdvance;

    // Deduct products from inventory in parallel (outside transaction to avoid nested transactions)
    await Promise.all(
      session.products.map((sp) =>
        inventoryService.useProduct({
          productId: sp.productId,
          quantity: sp.quantity,
          sessionId: session.id,
        })
      )
    );

    const result = await prisma.$transaction(async (tx) => {
      // Re-verify session status inside transaction to prevent race conditions
      const freshSession = await tx.session.findUnique({
        where: { id: sessionId },
        include: { appointment: { select: { status: true } } },
      });

      if (!freshSession) {
        throw new Error("SESSION_NOT_FOUND");
      }

      if (freshSession.appointment.status === "COMPLETED") {
        throw new Error("SESSION_ALREADY_COMPLETED");
      }

      if (freshSession.appointment.status !== "IN_PROGRESS") {
        throw new Error("SESSION_NOT_IN_PROGRESS");
      }

      let newPackagePurchase = null;
      // Use session's pre-selected package, or fall back to any active package
      let packagePurchaseToDeduct = sessionPackage || activePackage;

      // If selling a new package
      if (packageToSell && packageId) {
        // Deactivate any existing active packages for this baby
        await tx.packagePurchase.updateMany({
          where: {
            babyId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Create the new package purchase with 1 session already used
        // Calculate package discount (proportional if there are products)
        const packageDiscount = productsAmount.greaterThan(0)
          ? discountDecimal.mul(packageAmount).div(subtotalAmount)
          : discountDecimal;
        const packageFinalPrice = packageAmount.sub(packageDiscount).greaterThan(0)
          ? packageAmount.sub(packageDiscount)
          : new Prisma.Decimal(0);

        newPackagePurchase = await tx.packagePurchase.create({
          data: {
            babyId,
            packageId,
            totalSessions: packageToSell.sessionCount,
            usedSessions: 1, // This session counts as used
            remainingSessions: packageToSell.sessionCount - 1,
            basePrice: packageToSell.basePrice,
            discountAmount: packageDiscount,
            discountReason: discountReason || null,
            finalPrice: packageFinalPrice,
            isActive: true,
            // Transfer schedule preferences from appointment (set by parent in portal)
            schedulePreferences: appointmentWithPreferences?.pendingSchedulePreferences || null,
          },
        });

        packagePurchaseToDeduct = null; // Don't deduct from old package
      } else if (packagePurchaseToDeduct) {
        // Deduct 1 session from existing active package and get updated data
        const updatedExistingPurchase = await tx.packagePurchase.update({
          where: { id: packagePurchaseToDeduct.id },
          data: {
            usedSessions: { increment: 1 },
            remainingSessions: { decrement: 1 },
          },
          include: {
            package: true,
          },
        });
        // Use updated purchase data for the return value
        packagePurchaseToDeduct = updatedExistingPurchase;
      }

      // Link session to package purchase
      const packagePurchaseIdToLink = newPackagePurchase?.id || packagePurchaseToDeduct?.id;
      if (packagePurchaseIdToLink) {
        await tx.session.update({
          where: { id: sessionId },
          data: {
            packagePurchaseId: packagePurchaseIdToLink,
          },
        });
      }

      // Update session status
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Update appointment status
      await tx.appointment.update({
        where: { id: session.appointmentId },
        data: {
          status: "COMPLETED",
        },
      });

      // Reset parent noShowCount (they attended!)
      // For baby appointments, find parent through baby. For parent appointments, use parentId directly.
      let parentIdToReset: string | null = null;
      if (session.appointment.baby?.parents?.[0]) {
        parentIdToReset = session.appointment.baby.parents[0].parentId;
      } else if (session.appointment.parentId) {
        parentIdToReset = session.appointment.parentId;
      }
      if (parentIdToReset) {
        await tx.parent.update({
          where: { id: parentIdToReset },
          data: {
            noShowCount: 0,
          },
        });
      }

      // Record history
      await tx.appointmentHistory.create({
        data: {
          appointmentId: session.appointmentId,
          action: "COMPLETED",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          newValue: {
            status: "COMPLETED",
            productsAmount: productsAmount.toString(),
            packageAmount: packageAmount.toString(),
            discountAmount: discountAmount.toString(),
            discountReason: discountReason || null,
            totalAmount: totalAmount.toString(),
            packageSold: packageToSell?.name || null,
            isEvaluated: session.appointment.isEvaluated,
          },
        },
      });

      // Include the package purchase with its package info for bulk scheduling
      const finalPackagePurchase = newPackagePurchase
        ? await tx.packagePurchase.findUnique({
            where: { id: newPackagePurchase.id },
            include: { package: true }
          })
        : packagePurchaseToDeduct;

      return {
        session: updatedSession,
        packagePurchase: finalPackagePurchase,
        newPackagePurchase, // Track if new package was sold
        productsAmount,
        packageAmount,
        totalAmount,
        advancePaidAmount,
      };
    });

    // Create Transaction for session checkout (outside Prisma transaction since transactionService has its own logic)
    if (totalAmount.greaterThan(0)) {
      // Build transaction items
      const transactionItems: TransactionItemInput[] = [];

      // Add package item if selling a new package
      if (packageToSell && !packagePurchaseId) {
        const subtotalNum = Number(subtotalAmount);
        // Calculate package discount (proportional if there are products)
        const packageDiscount = subtotalNum > 0 && productsAmount.greaterThan(0)
          ? discountAmount * (Number(packageAmount) / subtotalNum)
          : discountAmount;
        // Add Baby Card first session discount to package discount if applicable
        const packageFirstSessionDiscount = firstSessionDiscountAmount.greaterThan(0) && subtotalNum > 0
          ? (productsAmount.greaterThan(0)
              ? Number(firstSessionDiscountAmount) * (Number(packageAmount) / subtotalNum)
              : Number(firstSessionDiscountAmount))
          : 0;

        transactionItems.push({
          itemType: "PACKAGE",
          referenceId: result.newPackagePurchase?.id || packageId,
          description: packageToSell.name,
          quantity: 1,
          unitPrice: Number(packageAmount),
          discountAmount: packageDiscount + packageFirstSessionDiscount,
          discountReason: [discountReason, packageFirstSessionDiscount > 0 ? "Baby Card first session" : null]
            .filter(Boolean)
            .join(", ") || undefined,
        });
      }

      // Add product items
      for (const sp of session.products) {
        if (sp.isChargeable) {
          // Calculate proportional discount for this product
          const productSubtotal = Number(sp.unitPrice) * sp.quantity;
          const subtotalNum = Number(subtotalAmount);
          let productDiscountProportion = 0;
          let productFirstSessionDiscount = 0;

          if (subtotalNum > 0) {
            // Proportional discount based on product's share of subtotal
            productDiscountProportion = discountAmount * (productSubtotal / subtotalNum);
            if (firstSessionDiscountAmount.greaterThan(0)) {
              productFirstSessionDiscount = Number(firstSessionDiscountAmount) * (productSubtotal / subtotalNum);
            }
          }

          transactionItems.push({
            itemType: "PRODUCT",
            referenceId: sp.productId,
            description: sp.product.name,
            quantity: sp.quantity,
            unitPrice: Number(sp.unitPrice),
            discountAmount: productDiscountProportion + productFirstSessionDiscount,
            discountReason: productDiscountProportion > 0 || productFirstSessionDiscount > 0
              ? [discountReason, productFirstSessionDiscount > 0 ? "Baby Card first session" : null]
                  .filter(Boolean)
                  .join(", ")
              : undefined,
          });
        }
      }

      // Add advance payments as negative item so total matches payment methods sum
      if (advancePaidAmount.greaterThan(0)) {
        transactionItems.push({
          itemType: "ADVANCE",
          description: "Anticipos pagados",
          quantity: 1,
          unitPrice: -Number(advancePaidAmount),
          discountAmount: 0,
        });
      }

      // Normalize payment methods - convert from legacy format if needed
      const paymentMethodsArray: PaymentMethodEntry[] = paymentDetails
        ? paymentDetails.map((d) => ({
            method: d.paymentMethod,
            amount: d.amount,
            reference: d.reference || undefined,
          }))
        : paymentMethod
          ? [{ method: paymentMethod, amount: Number(totalAmount) }]
          : [];

      // Create transaction if we have items and payment methods
      if (transactionItems.length > 0 && paymentMethodsArray.length > 0) {
        try {
          await transactionService.create({
            type: "INCOME",
            category: "SESSION",
            referenceType: "Session",
            referenceId: sessionId,
            items: transactionItems,
            paymentMethods: paymentMethodsArray,
            notes: paymentNotes,
            createdById: userId,
            cashRegisterId,
          });
        } catch (error) {
          // Log error but don't fail session completion
          console.error("Error creating transaction for session:", error);
        }
      }
    }

    // Apply Baby Card first session discount if used
    let firstSessionDiscountApplied = null;
    if (babyCardPurchaseIdForDiscount && firstSessionDiscountAmount.greaterThan(0)) {
      try {
        const discountResult = await babyCardService.applyFirstSessionDiscount(
          babyCardPurchaseIdForDiscount,
          sessionId,
          Number(subtotalAmount)
        );
        firstSessionDiscountApplied = {
          amount: discountResult.discountApplied,
          purchaseId: babyCardPurchaseIdForDiscount,
        };
      } catch (error) {
        console.error("Error applying Baby Card first session discount:", error);
      }
    }

    // After completing the session, increment Baby Card progress if baby has active card
    let babyCardInfo = null;
    if (babyId) {
      try {
        // If a new package was sold, increment by the full package session count
        // Otherwise, increment by 1 for single session
        const sessionsToAdd = result.newPackagePurchase
          ? result.newPackagePurchase.totalSessions
          : 1;

        const babyCardResult = sessionsToAdd > 1
          ? await babyCardService.incrementSessionCountByAmount(babyId, sessionsToAdd)
          : await babyCardService.incrementSessionCount(babyId, sessionId);

        if (babyCardResult.purchase) {
          babyCardInfo = {
            purchaseId: babyCardResult.purchase.id,
            cardName: babyCardResult.purchase.babyCard.name,
            completedSessions: babyCardResult.purchase.completedSessions,
            totalSessions: babyCardResult.purchase.babyCard.totalSessions,
            isCompleted: babyCardResult.purchase.status === "COMPLETED",
            newRewards: babyCardResult.newRewards.map((r) => ({
              id: r.id,
              displayName: r.displayName,
              displayIcon: r.displayIcon,
              rewardType: r.rewardType,
            })),
          };
        }
      } catch (error) {
        // Don't fail the session completion if Baby Card tracking fails
        console.error("Error updating Baby Card progress:", error);
      }
    }

    // Log activity for completed session
    // Handle both baby and parent-only appointments
    const isParentAppointment = !session.appointment.babyId && session.appointment.parentId;
    const clientName = isParentAppointment
      ? session.appointment.parent?.name || "N/A"
      : session.appointment.baby?.name || "N/A";
    const packageName = packageToSell?.name || sessionPackage?.package?.name || activePackage?.package?.name || "N/A";
    try {
      await activityService.logSessionCompleted(sessionId, {
        babyName: clientName, // Can be baby name or parent name depending on appointment type
        packageName,
        sessionNumber: result.session.sessionNumber || undefined,
        totalAmount: Number(result.totalAmount),
        paymentMethods: paymentDetails?.map((d) => d.paymentMethod) || (paymentMethod ? [paymentMethod] : undefined),
        date: fromDateOnly(session.appointment.date), // For calendar navigation
        appointmentId: session.appointmentId, // For highlighting the appointment
      }, userId);

      // Log discount if applied
      if (discountAmount > 0) {
        await activityService.logDiscountApplied(sessionId, {
          babyName: clientName,
          originalPrice: Number(subtotalAmount),
          discountAmount,
          reason: discountReason || undefined,
          date: fromDateOnly(session.appointment.date),
          appointmentId: session.appointmentId,
        }, userId);
      }
    } catch (error) {
      // Don't fail session completion if activity logging fails
      console.error("Error logging session activity:", error);
    }

    // Count already-scheduled appointments for the package to calculate truly available sessions
    let scheduledForPackage = 0;
    if (result.packagePurchase?.id) {
      scheduledForPackage = await prisma.appointment.count({
        where: {
          packagePurchaseId: result.packagePurchase.id,
          status: { in: ["SCHEDULED", "PENDING_PAYMENT", "IN_PROGRESS"] },
        },
      });
    }

    return { ...result, babyCardInfo, firstSessionDiscountApplied, advancePaidAmount: Number(advancePaidAmount), scheduledForPackage };
  },

  /**
   * Mark appointment as No-Show
   * - Increment parent noShowCount
   * - Set requiresPrepayment if >= 3
   * - Mark as NO_SHOW
   * Note: No session return needed since deduction happens at completion, not booking
   */
  async markNoShow(input: MarkNoShowInput) {
    const { appointmentId, userId, userName } = input;

    // Get appointment with baby and parent info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        baby: {
          include: {
            parents: {
              where: { isPrimary: true },
              include: { parent: true },
            },
          },
        },
        parent: true, // Include parent for parent-only appointments
        session: true,
      },
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    if (appointment.status !== "SCHEDULED") {
      throw new Error("APPOINTMENT_NOT_SCHEDULED");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update appointment status
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "NO_SHOW",
        },
      });

      // Increment parent noShowCount and check for prepayment requirement
      // For baby appointments, find parent through baby. For parent appointments, use parentId directly.
      let parentToUpdate: { id: string; noShowCount: number } | null = null;
      if (appointment.baby?.parents?.[0]) {
        const primaryParent = appointment.baby.parents[0];
        parentToUpdate = { id: primaryParent.parentId, noShowCount: primaryParent.parent.noShowCount };
      } else if (appointment.parentId && appointment.parent) {
        parentToUpdate = { id: appointment.parentId, noShowCount: appointment.parent.noShowCount };
      }
      if (parentToUpdate) {
        const newNoShowCount = parentToUpdate.noShowCount + 1;
        await tx.parent.update({
          where: { id: parentToUpdate.id },
          data: {
            noShowCount: newNoShowCount,
            requiresPrepayment: newNoShowCount >= 3,
            lastNoShowDate: new Date(),
          },
        });
      }

      // Note: No session return needed here since sessions are only deducted
      // when the session is completed, not when the appointment is booked

      // Record history
      await tx.appointmentHistory.create({
        data: {
          appointmentId,
          action: "NO_SHOW",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          newValue: { status: "NO_SHOW" },
        },
      });

      return updatedAppointment;
    });

    return result;
  },

  /**
   * Save evaluation (Therapist only)
   */
  async saveEvaluation(input: EvaluationInput) {
    const { sessionId, ...evaluationData } = input;

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        appointment: true,
        evaluation: true,
      },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }

    if (session.evaluation) {
      throw new Error("EVALUATION_ALREADY_EXISTS");
    }

    if (session.appointment.status === "SCHEDULED") {
      throw new Error("SESSION_NOT_STARTED");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create evaluation
      const evaluation = await tx.evaluation.create({
        data: {
          sessionId,
          babyAgeMonths: evaluationData.babyAgeMonths,
          babyWeight: evaluationData.babyWeight,
          hydrotherapy: evaluationData.hydrotherapy,
          massage: evaluationData.massage,
          motorStimulation: evaluationData.motorStimulation,
          sensoryStimulation: evaluationData.sensoryStimulation,
          relaxation: evaluationData.relaxation,
          otherActivities: evaluationData.otherActivities,
          visualTracking: evaluationData.visualTracking,
          eyeContact: evaluationData.eyeContact,
          auditoryResponse: evaluationData.auditoryResponse,
          muscleTone: evaluationData.muscleTone,
          cervicalControl: evaluationData.cervicalControl,
          headUp: evaluationData.headUp,
          sits: evaluationData.sits,
          crawls: evaluationData.crawls,
          walks: evaluationData.walks,
          mood: evaluationData.mood,
          internalNotes: evaluationData.internalNotes,
          externalNotes: evaluationData.externalNotes,
        },
      });

      // Update session status and evaluatedAt
      await tx.session.update({
        where: { id: sessionId },
        data: {
          status: "EVALUATED",
          evaluatedAt: new Date(),
        },
      });

      // Mark appointment as evaluated
      await tx.appointment.update({
        where: { id: session.appointmentId },
        data: {
          isEvaluated: true,
        },
      });

      return evaluation;
    });

    return result;
  },

  /**
   * Get sessions for a specific date for a therapist
   * - SCHEDULED: visible to ALL therapists (no actions available)
   * - IN_PROGRESS/COMPLETED: visible only to the ASSIGNED therapist
   */
  async getSessionsForTherapist(therapistId: string, date?: Date) {
    // Normalize to UTC noon for consistent date handling
    const targetDate = normalizeToUTCNoon(date || new Date());
    const startOfDay = getStartOfDayUTC(targetDate);
    const endOfDay = getEndOfDayUTC(targetDate);

    // Common include object for both queries
    const appointmentInclude = {
      baby: {
        include: {
          parents: {
            where: { isPrimary: true },
            include: { parent: true },
            take: 1,
          },
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          phone: true,
          pregnancyWeeks: true,
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
        },
      },
      session: {
        include: {
          evaluation: true,
        },
      },
      packagePurchase: {
        select: {
          id: true,
          package: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      selectedPackage: {
        select: {
          id: true,
          name: true,
        },
      },
    } as const;

    // Fetch both queries in parallel for better performance
    const [scheduledAppointments, assignedAppointments] = await Promise.all([
      // Get ALL scheduled appointments for the date (visible to all therapists)
      prisma.appointment.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: "SCHEDULED",
        },
        include: appointmentInclude,
        orderBy: {
          startTime: "asc",
        },
      }),
      // Get only IN_PROGRESS and COMPLETED appointments assigned to this therapist
      prisma.appointment.findMany({
        where: {
          therapistId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ["IN_PROGRESS", "COMPLETED"],
          },
        },
        include: appointmentInclude,
        orderBy: {
          startTime: "asc",
        },
      }),
    ]);

    // Combine and sort by startTime
    const allAppointments = [...scheduledAppointments, ...assignedAppointments].sort(
      (a, b) => a.startTime.localeCompare(b.startTime)
    );

    return allAppointments;
  },

  /**
   * Get today's all appointments (for admin/reception)
   */
  async getTodayAll() {
    // Use UTC noon for consistent date handling
    const today = normalizeToUTCNoon(new Date());
    const startOfDay = getStartOfDayUTC(today);
    const endOfDay = getEndOfDayUTC(today);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        baby: {
          include: {
            parents: {
              where: { isPrimary: true },
              include: { parent: true },
              take: 1,
            },
          },
        },
        therapist: true,
        session: {
          include: {
            evaluation: true,
            products: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return appointments;
  },

  /**
   * Get session details by ID
   */
  async getById(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        appointment: {
          include: {
            baby: {
              include: {
                parents: {
                  include: { parent: true },
                },
              },
            },
            parent: true, // For parent appointments (prenatal massage, etc.)
            therapist: true,
            selectedPackage: true,
          },
        },
        baby: true,
        therapist: true,
        evaluation: true,
        products: {
          include: { product: true },
        },
        packagePurchase: {
          include: { package: true },
        },
      },
    });
  },

  /**
   * Get pending evaluations count (for admin widget)
   */
  async getPendingEvaluationsCount() {
    const count = await prisma.appointment.count({
      where: {
        status: "COMPLETED",
        isEvaluated: false,
      },
    });

    return count;
  },

  /**
   * Get pending evaluations list (for admin widget)
   */
  async getPendingEvaluations() {
    return prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
        isEvaluated: false,
      },
      include: {
        baby: true,
        therapist: true,
        session: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });
  },

  /**
   * Get therapists list (for selection)
   */
  async getTherapists() {
    return prisma.user.findMany({
      where: {
        role: "THERAPIST",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Get all sessions for a baby with evaluations (for baby profile)
   */
  async getByBabyId(babyId: string) {
    return prisma.session.findMany({
      where: {
        babyId,
        status: {
          in: ["COMPLETED", "EVALUATED"],
        },
      },
      include: {
        appointment: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
        evaluation: true,
        packagePurchase: {
          include: {
            package: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
