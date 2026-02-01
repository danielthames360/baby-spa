import { prisma } from "@/lib/db";
import { ActivityType, Prisma } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  performedById?: string | null;
}

interface ActivityFilters {
  types?: ActivityType[];
  performedById?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

// Base type for indexable metadata
type IndexableMetadata = {
  [key: string]: unknown;
};

// Metadata types for different activity types
interface SessionCompletedMetadata extends IndexableMetadata {
  babyName: string;
  packageName: string;
  sessionNumber?: number;
  totalAmount?: number;
  paymentMethods?: string[];
  date?: string; // Appointment date for navigation
  appointmentId?: string; // Appointment ID for navigation
}

interface DiscountAppliedMetadata extends IndexableMetadata {
  babyName: string;
  originalPrice: number;
  discountAmount: number;
  discountPercent?: number;
  reason?: string;
  date?: string; // Appointment date for navigation
  appointmentId?: string; // Appointment ID for navigation
}

interface AppointmentMetadata extends IndexableMetadata {
  babyName?: string;
  parentName?: string;
  date: string;
  time: string;
  packageName?: string;
  cancellationReason?: string;
  newDate?: string;
  newTime?: string;
}

interface BabyCardMetadata extends IndexableMetadata {
  babyName: string;
  cardName: string;
  pricePaid?: number;
  rewardName?: string;
  sessionNumber?: number;
}

interface InstallmentMetadata extends IndexableMetadata {
  babyName?: string;
  parentName?: string;
  packageName: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
}

interface EventMetadata extends IndexableMetadata {
  babyName?: string;
  parentName?: string;
  eventName: string;
  eventDate: string;
}

interface BabyCreatedMetadata extends IndexableMetadata {
  babyName: string;
  parentNames: string[];
}

interface PackageAssignedMetadata extends IndexableMetadata {
  babyName?: string;
  parentName?: string;
  packageName: string;
  totalSessions: number;
  totalPrice: number;
}

interface ClientUpdatedMetadata extends IndexableMetadata {
  clientName: string;
  clientType: "baby" | "parent";
  fieldsUpdated?: string[];
}

interface EvaluationMetadata extends IndexableMetadata {
  babyName?: string;
  parentName?: string;
  therapistName: string;
  date: string;
  appointmentId: string;
}

interface StaffPaymentMetadata extends IndexableMetadata {
  staffName: string;
  type: string;
  grossAmount: number;
  netAmount: number;
  advanceDeducted?: number;
  description?: string;
}

interface ExpenseMetadata extends IndexableMetadata {
  category: string;
  description: string;
  amount: number;
  reference?: string;
}

// ============================================================
// INCLUDES
// ============================================================

const activityInclude = {
  performedBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ActivityInclude;

// ============================================================
// SERVICE
// ============================================================

export const activityService = {
  // ----------------------
  // CREATE
  // ----------------------

  /**
   * Create an activity log entry
   */
  async log(input: CreateActivityInput) {
    return prisma.activity.create({
      data: {
        type: input.type,
        title: input.title,
        description: input.description,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        performedById: input.performedById,
      },
      include: activityInclude,
    });
  },

  // ----------------------
  // HELPERS BY TYPE
  // ----------------------

  /**
   * Log session completed
   */
  async logSessionCompleted(
    sessionId: string,
    metadata: SessionCompletedMetadata,
    performedById: string
  ) {
    return this.log({
      type: "SESSION_COMPLETED",
      title: "activity.session_completed",
      entityType: "session",
      entityId: sessionId,
      metadata,
      performedById,
    });
  },

  /**
   * Log discount applied
   */
  async logDiscountApplied(
    sessionId: string,
    metadata: DiscountAppliedMetadata,
    performedById: string
  ) {
    return this.log({
      type: "DISCOUNT_APPLIED",
      title: "activity.discount_applied",
      entityType: "session",
      entityId: sessionId,
      metadata,
      performedById,
    });
  },

  /**
   * Log appointment created (by staff)
   */
  async logAppointmentCreated(
    appointmentId: string,
    metadata: AppointmentMetadata,
    performedById: string
  ) {
    return this.log({
      type: "APPOINTMENT_CREATED",
      title: "activity.appointment_created",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById,
    });
  },

  /**
   * Log appointment created from portal
   */
  async logAppointmentCreatedPortal(
    appointmentId: string,
    metadata: AppointmentMetadata
  ) {
    return this.log({
      type: "APPOINTMENT_CREATED_PORTAL",
      title: "activity.appointment_created_portal",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById: null, // System/Portal action
    });
  },

  /**
   * Log appointment cancelled (by staff)
   */
  async logAppointmentCancelled(
    appointmentId: string,
    metadata: AppointmentMetadata,
    performedById: string
  ) {
    return this.log({
      type: "APPOINTMENT_CANCELLED",
      title: "activity.appointment_cancelled",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById,
    });
  },

  /**
   * Log appointment cancelled from portal
   */
  async logAppointmentCancelledPortal(
    appointmentId: string,
    metadata: AppointmentMetadata
  ) {
    return this.log({
      type: "APPOINTMENT_CANCELLED_PORTAL",
      title: "activity.appointment_cancelled_portal",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById: null,
    });
  },

  /**
   * Log appointment rescheduled (by staff)
   */
  async logAppointmentRescheduled(
    appointmentId: string,
    metadata: AppointmentMetadata,
    performedById: string
  ) {
    return this.log({
      type: "APPOINTMENT_RESCHEDULED",
      title: "activity.appointment_rescheduled",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById,
    });
  },

  /**
   * Log appointment rescheduled from portal
   */
  async logAppointmentRescheduledPortal(
    appointmentId: string,
    metadata: AppointmentMetadata
  ) {
    return this.log({
      type: "APPOINTMENT_RESCHEDULED_PORTAL",
      title: "activity.appointment_rescheduled_portal",
      entityType: "appointment",
      entityId: appointmentId,
      metadata,
      performedById: null,
    });
  },

  /**
   * Log baby card sold
   */
  async logBabyCardSold(
    purchaseId: string,
    metadata: BabyCardMetadata,
    performedById: string
  ) {
    return this.log({
      type: "BABY_CARD_SOLD",
      title: "activity.baby_card_sold",
      entityType: "babyCardPurchase",
      entityId: purchaseId,
      metadata,
      performedById,
    });
  },

  /**
   * Log baby card reward delivered
   */
  async logBabyCardRewardDelivered(
    purchaseId: string,
    metadata: BabyCardMetadata,
    performedById: string
  ) {
    return this.log({
      type: "BABY_CARD_REWARD_DELIVERED",
      title: "activity.baby_card_reward_delivered",
      entityType: "babyCardPurchase",
      entityId: purchaseId,
      metadata,
      performedById,
    });
  },

  /**
   * Log installment paid
   */
  async logInstallmentPaid(
    purchaseId: string,
    metadata: InstallmentMetadata,
    performedById: string
  ) {
    return this.log({
      type: "INSTALLMENT_PAID",
      title: "activity.installment_paid",
      entityType: "packagePurchase",
      entityId: purchaseId,
      metadata,
      performedById,
    });
  },

  /**
   * Log event registration
   */
  async logEventRegistration(
    participantId: string,
    metadata: EventMetadata,
    performedById: string
  ) {
    return this.log({
      type: "EVENT_REGISTRATION",
      title: "activity.event_registration",
      entityType: "eventParticipant",
      entityId: participantId,
      metadata,
      performedById,
    });
  },

  /**
   * Log baby created
   */
  async logBabyCreated(
    babyId: string,
    metadata: BabyCreatedMetadata,
    performedById: string
  ) {
    return this.log({
      type: "BABY_CREATED",
      title: "activity.baby_created",
      entityType: "baby",
      entityId: babyId,
      metadata,
      performedById,
    });
  },

  /**
   * Log package assigned
   */
  async logPackageAssigned(
    purchaseId: string,
    metadata: PackageAssignedMetadata,
    performedById: string
  ) {
    return this.log({
      type: "PACKAGE_ASSIGNED",
      title: "activity.package_assigned",
      entityType: "packagePurchase",
      entityId: purchaseId,
      metadata,
      performedById,
    });
  },

  /**
   * Log client updated
   */
  async logClientUpdated(
    clientId: string,
    metadata: ClientUpdatedMetadata,
    performedById: string
  ) {
    return this.log({
      type: "CLIENT_UPDATED",
      title: "activity.client_updated",
      entityType: metadata.clientType,
      entityId: clientId,
      metadata,
      performedById,
    });
  },

  /**
   * Log evaluation saved (by therapist)
   */
  async logEvaluationSaved(
    evaluationId: string,
    metadata: EvaluationMetadata,
    performedById: string
  ) {
    return this.log({
      type: "EVALUATION_SAVED",
      title: "activity.evaluation_saved",
      entityType: "evaluation",
      entityId: evaluationId,
      metadata,
      performedById,
    });
  },

  /**
   * Log staff payment registered
   */
  async logStaffPaymentRegistered(
    paymentId: string,
    metadata: StaffPaymentMetadata,
    performedById: string
  ) {
    return this.log({
      type: "STAFF_PAYMENT_REGISTERED",
      title: "activity.staff_payment_registered",
      entityType: "staffPayment",
      entityId: paymentId,
      metadata,
      performedById,
    });
  },

  /**
   * Log expense registered
   */
  async logExpenseRegistered(
    expenseId: string,
    metadata: ExpenseMetadata,
    performedById: string
  ) {
    return this.log({
      type: "EXPENSE_REGISTERED",
      title: "activity.expense_registered",
      entityType: "expense",
      entityId: expenseId,
      metadata,
      performedById,
    });
  },

  // ----------------------
  // READ
  // ----------------------

  /**
   * List activities with filters and pagination
   */
  async list(filters: ActivityFilters = {}) {
    const { types, performedById, from, to, page = 1, limit = 20 } = filters;

    const where: Prisma.ActivityWhereInput = {};

    // Filter by types
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    // Filter by performer
    if (performedById) {
      where.performedById = performedById;
    }

    // Filter by date range
    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = from;
      }
      if (to) {
        // Include the entire "to" day
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // Execute both queries in parallel
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: activityInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get activity by ID
   */
  async getById(id: string) {
    return prisma.activity.findUnique({
      where: { id },
      include: activityInclude,
    });
  },

  /**
   * Get count of activities (for dashboard widgets)
   */
  async getCount(filters: Omit<ActivityFilters, "page" | "limit"> = {}) {
    const { types, performedById, from, to } = filters;

    const where: Prisma.ActivityWhereInput = {};

    if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (performedById) {
      where.performedById = performedById;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    return prisma.activity.count({ where });
  },

  // ----------------------
  // CLEANUP (for future cron job - Fase 10)
  // ----------------------

  /**
   * Delete activities older than specified days (default: 365 days = 1 year)
   * To be called by cron job in Fase 10
   */
  async cleanupOld(retentionDays: number = 365) {
    // Use timestamp math to avoid timezone issues
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.activity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  },
};

// Export types for use in other services
export type {
  CreateActivityInput,
  ActivityFilters,
  SessionCompletedMetadata,
  DiscountAppliedMetadata,
  AppointmentMetadata,
  BabyCardMetadata,
  InstallmentMetadata,
  EventMetadata,
  BabyCreatedMetadata,
  PackageAssignedMetadata,
  ClientUpdatedMetadata,
  StaffPaymentMetadata,
  ExpenseMetadata,
};
