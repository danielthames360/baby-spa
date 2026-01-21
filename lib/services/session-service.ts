import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { inventoryService } from "./inventory-service";
import { packageService } from "./package-service";

// Types for service inputs
interface StartSessionInput {
  appointmentId: string;
  therapistId: string;
  packagePurchaseId?: string | null; // If null/undefined: trial session, if provided: use that package
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
  paymentMethod?: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  paymentNotes?: string;
  discountAmount?: number;
  discountReason?: string;
  userId: string;
  userName: string;
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
   * - If packagePurchaseId is null/undefined, it's a trial session
   */
  async startSession(input: StartSessionInput) {
    const { appointmentId, therapistId, packagePurchaseId, userId, userName } = input;

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

    // Get the selected package purchase (if provided)
    let selectedPackage = null;
    let sessionNumber = 1;

    if (packagePurchaseId) {
      selectedPackage = await prisma.packagePurchase.findUnique({
        where: { id: packagePurchaseId },
      });

      if (!selectedPackage) {
        throw new Error("PACKAGE_PURCHASE_NOT_FOUND");
      }

      if (selectedPackage.babyId !== appointment.babyId) {
        throw new Error("PACKAGE_NOT_FOR_THIS_BABY");
      }

      if (selectedPackage.remainingSessions <= 0) {
        throw new Error("NO_SESSIONS_REMAINING");
      }

      sessionNumber = selectedPackage.usedSessions + 1;
    }

    // Create session and update appointment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "IN_PROGRESS",
          therapistId,
        },
      });

      // Create session
      // Note: packagePurchaseId can be null for trial sessions
      const session = await tx.session.create({
        data: {
          appointmentId,
          babyId: appointment.babyId,
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
            isTrialSession: !selectedPackage,
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
    const { sessionId, packageId, paymentMethod, paymentNotes, discountAmount = 0, discountReason, userId, userName } = input;

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
          },
        },
        products: {
          include: { product: true },
        },
        packagePurchase: true,
      },
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

    // Check if baby has an active package with sessions
    const activePackage = await packageService.getActivePackageForBaby(babyId);
    const hasActivePackageWithSessions = activePackage && activePackage.remainingSessions > 0;

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
    let packageAmount = new Prisma.Decimal(0);
    let packageToSell = null;
    if (packageId && !hasActivePackageWithSessions) {
      packageToSell = await prisma.package.findUnique({
        where: { id: packageId },
      });
      if (packageToSell) {
        packageAmount = new Prisma.Decimal(packageToSell.basePrice.toString());
      }
    }

    const subtotalAmount = productsAmount.add(packageAmount);
    const discountDecimal = new Prisma.Decimal(discountAmount);
    const totalAmount = subtotalAmount.sub(discountDecimal).greaterThan(0)
      ? subtotalAmount.sub(discountDecimal)
      : new Prisma.Decimal(0);

    // Deduct products from inventory (outside transaction to avoid nested transactions)
    for (const sp of session.products) {
      await inventoryService.useProduct({
        productId: sp.productId,
        quantity: sp.quantity,
        sessionId: session.id,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let newPackagePurchase = null;
      let packagePurchaseToDeduct = activePackage;

      // Create payment first if there's a total amount (needed for package purchase link)
      let payment = null;
      if (totalAmount.greaterThan(0) && paymentMethod) {
        // Build payment notes with discount reason if applicable
        let finalPaymentNotes = paymentNotes || "";
        if (discountAmount > 0 && discountReason) {
          finalPaymentNotes = finalPaymentNotes
            ? `${finalPaymentNotes} | Descuento: ${discountReason}`
            : `Descuento: ${discountReason}`;
        }

        payment = await tx.payment.create({
          data: {
            sessionId,
            amount: totalAmount,
            method: paymentMethod,
            notes: finalPaymentNotes || null,
          },
        });
      }

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
            paymentId: payment?.id, // Link to payment
          },
        });

        packagePurchaseToDeduct = null; // Don't deduct from old package
      } else if (packagePurchaseToDeduct) {
        // Deduct 1 session from existing active package
        await tx.packagePurchase.update({
          where: { id: packagePurchaseToDeduct.id },
          data: {
            usedSessions: { increment: 1 },
            remainingSessions: { decrement: 1 },
          },
        });
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
      const primaryParent = session.appointment.baby.parents[0];
      if (primaryParent) {
        await tx.parent.update({
          where: { id: primaryParent.parentId },
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

      return {
        session: updatedSession,
        payment,
        packagePurchase: newPackagePurchase,
        productsAmount,
        packageAmount,
        totalAmount,
      };
    });

    return result;
  },

  /**
   * Mark appointment as No-Show
   * - Increment parent noShowCount
   * - Set requiresPrepayment if >= 3
   * - Return session to package
   * - Mark as NO_SHOW
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
            packagePurchases: {
              where: { isActive: true },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        },
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
      const primaryParent = appointment.baby.parents[0];
      if (primaryParent) {
        const newNoShowCount = primaryParent.parent.noShowCount + 1;
        await tx.parent.update({
          where: { id: primaryParent.parentId },
          data: {
            noShowCount: newNoShowCount,
            requiresPrepayment: newNoShowCount >= 3,
            lastNoShowDate: new Date(),
          },
        });
      }

      // Return session to package (if session was already deducted during booking)
      const activePackage = appointment.baby.packagePurchases[0];
      if (activePackage) {
        await tx.packagePurchase.update({
          where: { id: activePackage.id },
          data: {
            usedSessions: { decrement: 1 },
            remainingSessions: { increment: 1 },
          },
        });
      }

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
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get ALL scheduled appointments for the date (visible to all therapists)
    const scheduledAppointments = await prisma.appointment.findMany({
      where: {
        date: targetDate,
        status: "SCHEDULED",
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
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get only IN_PROGRESS and COMPLETED appointments assigned to this therapist
    const assignedAppointments = await prisma.appointment.findMany({
      where: {
        therapistId,
        date: targetDate,
        status: {
          in: ["IN_PROGRESS", "COMPLETED"],
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
      },
      orderBy: {
        startTime: "asc",
      },
    });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: today,
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
            therapist: true,
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
        payment: true,
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
