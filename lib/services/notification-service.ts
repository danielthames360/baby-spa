import { prisma } from "@/lib/db";
import { StaffNotificationType, UserRole, Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { fromDateOnly, formatDateForDisplay } from "@/lib/utils/date-utils";

// ============================================================
// TYPES
// ============================================================

interface CreateNotificationInput {
  type: StaffNotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  forRole?: UserRole;
}

interface AppointmentForNotification {
  id: string;
  date: Date;
  startTime: string;
  status: string;
  baby?: { name: string } | null;
  parent?: { name: string } | null;
}

interface NotificationFilters {
  unread?: boolean;
  forRole?: UserRole;
  limit?: number;
}

// ============================================================
// INCLUDES
// ============================================================

const notificationInclude = {
  readBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.NotificationInclude;

// ============================================================
// SERVICE
// ============================================================

export const notificationService = {
  // ----------------------
  // CREATE
  // ----------------------

  /**
   * Create a notification
   */
  async create(input: CreateNotificationInput) {
    // Get expiration days from settings (default 7)
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { notificationExpirationDays: true },
    });
    const expirationDays = settings?.notificationExpirationDays ?? 7;
    const expiresAt = addDays(new Date(), expirationDays);

    return prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        forRole: input.forRole ?? "RECEPTION",
        expiresAt,
      },
      include: notificationInclude,
    });
  },

  /**
   * Create notification for a new appointment from portal
   */
  async createForNewAppointment(
    appointment: AppointmentForNotification,
    locale: string = "es"
  ) {
    const isPending = appointment.status === "PENDING_PAYMENT";
    const clientName =
      appointment.baby?.name || appointment.parent?.name || "Cliente";
    const dateStr = formatDateForDisplay(appointment.date, locale);

    return this.create({
      type: "NEW_APPOINTMENT",
      title: isPending ? "Cita pendiente de pago" : "Nueva cita agendada",
      message: `${clientName} - ${dateStr} ${appointment.startTime}`,
      entityType: "appointment",
      entityId: appointment.id,
      metadata: {
        date: fromDateOnly(appointment.date),
        isPendingPayment: isPending,
      },
      forRole: "RECEPTION",
    });
  },

  /**
   * Create notification for a cancelled appointment from portal
   * (For future use - Phase 8)
   */
  async createForCancelledAppointment(
    appointment: AppointmentForNotification,
    locale: string = "es"
  ) {
    const clientName =
      appointment.baby?.name || appointment.parent?.name || "Cliente";
    const dateStr = formatDateForDisplay(appointment.date, locale);

    return this.create({
      type: "CANCELLED_APPOINTMENT",
      title: "Cita cancelada",
      message: `${clientName} - ${dateStr} ${appointment.startTime}`,
      entityType: "appointment",
      entityId: appointment.id,
      metadata: {
        date: fromDateOnly(appointment.date),
      },
      forRole: "RECEPTION",
    });
  },

  /**
   * Create notification for a rescheduled appointment from portal
   * (For future use - Phase 8)
   */
  async createForRescheduledAppointment(
    appointment: AppointmentForNotification,
    oldDate: Date,
    oldTime: string,
    locale: string = "es"
  ) {
    const clientName =
      appointment.baby?.name || appointment.parent?.name || "Cliente";
    const newDateStr = formatDateForDisplay(appointment.date, locale);
    const oldDateStr = formatDateForDisplay(oldDate, locale);

    return this.create({
      type: "RESCHEDULED_APPOINTMENT",
      title: "Cita reagendada",
      message: `${clientName} - De ${oldDateStr} ${oldTime} a ${newDateStr} ${appointment.startTime}`,
      entityType: "appointment",
      entityId: appointment.id,
      metadata: {
        date: fromDateOnly(appointment.date),
        oldDate: fromDateOnly(oldDate),
        oldTime,
      },
      forRole: "RECEPTION",
    });
  },

  // ----------------------
  // READ
  // ----------------------

  /**
   * List notifications with filters
   */
  async list(filters: NotificationFilters = {}) {
    const where: Prisma.NotificationWhereInput = {
      // Only show non-expired notifications
      expiresAt: { gt: new Date() },
    };

    if (filters.unread !== undefined) {
      where.isRead = !filters.unread;
    }

    if (filters.forRole) {
      where.forRole = filters.forRole;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: { createdAt: "desc" },
        take: filters.limit ?? 50,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  },

  /**
   * Get count of unread notifications and last created timestamp
   * This is the lightweight endpoint for polling
   */
  async getCount(forRole?: UserRole) {
    const where: Prisma.NotificationWhereInput = {
      isRead: false,
      expiresAt: { gt: new Date() },
    };

    if (forRole) {
      where.forRole = forRole;
    }

    const [count, lastNotification] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findFirst({
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      count,
      lastCreatedAt: lastNotification?.createdAt?.toISOString() ?? null,
    };
  },

  /**
   * Get a single notification by ID
   */
  async getById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: notificationInclude,
    });
  },

  // ----------------------
  // UPDATE
  // ----------------------

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readById: userId,
      },
      include: notificationInclude,
    });
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(userId: string, forRole?: UserRole) {
    const where: Prisma.NotificationWhereInput = {
      isRead: false,
      expiresAt: { gt: new Date() },
    };

    if (forRole) {
      where.forRole = forRole;
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
        readById: userId,
      },
    });

    return { updated: result.count };
  },

  // ----------------------
  // DELETE
  // ----------------------

  /**
   * Delete expired notifications (for cron job)
   * This will be used in a future phase
   */
  async deleteExpired() {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { deleted: result.count };
  },
};
