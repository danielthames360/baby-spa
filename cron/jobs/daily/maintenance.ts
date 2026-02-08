/**
 * Maintenance Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Daily maintenance tasks:
 * - Mark old appointments as NO_SHOW
 * - Update parent noShowCount
 * - Activate requiresPrepayment for 3+ no-shows
 * - Deactivate babies older than 3 years
 * - Expire old pending WhatsApp messages
 * - Clean expired notifications
 */

import { PrismaClient, AppointmentStatus, PendingMessageStatus } from "@prisma/client";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
}

interface MaintenanceResult {
  noShowMarked: number;
  prepaymentActivated: number;
  babiesDeactivated: number;
  messagesExpired: number;
  notificationsCleared: number;
}

/**
 * Run daily maintenance job
 */
export async function runMaintenance(
  prisma: PrismaClient,
  _config: CountryConfig
): Promise<number> {
  const result: MaintenanceResult = {
    noShowMarked: 0,
    prepaymentActivated: 0,
    babiesDeactivated: 0,
    messagesExpired: 0,
    notificationsCleared: 0,
  };

  // 1. Mark NO_SHOW for appointments 2+ days old
  result.noShowMarked = await markNoShowAppointments(prisma);

  // 2. Activate prepayment for parents with 3+ no-shows
  result.prepaymentActivated = await activatePrepaymentRequirement(prisma);

  // 3. Deactivate babies older than 3 years
  result.babiesDeactivated = await deactivateOldBabies(prisma);

  // 4. Expire old pending WhatsApp messages
  result.messagesExpired = await expirePendingMessages(prisma);

  // 5. Clear expired notifications
  result.notificationsCleared = await clearExpiredNotifications(prisma);

  console.log("[Maintenance] Results:", result);

  return (
    result.noShowMarked +
    result.prepaymentActivated +
    result.babiesDeactivated +
    result.messagesExpired +
    result.notificationsCleared
  );
}

/**
 * Mark old appointments as NO_SHOW
 * - Appointments that are SCHEDULED or PENDING_PAYMENT
 * - Date was 2+ days ago
 */
async function markNoShowAppointments(prisma: PrismaClient): Promise<number> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
  twoDaysAgo.setUTCHours(23, 59, 59, 999); // End of day 2 days ago

  // Find appointments to mark as NO_SHOW
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { lt: twoDaysAgo },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING_PAYMENT],
      },
    },
    include: {
      baby: {
        include: {
          parents: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (appointments.length === 0) return 0;

  // Mark as NO_SHOW
  await prisma.appointment.updateMany({
    where: {
      id: { in: appointments.map((a) => a.id) },
    },
    data: {
      status: AppointmentStatus.NO_SHOW,
    },
  });

  // Collect parent IDs to increment noShowCount
  const parentIds = new Set<string>();
  for (const appt of appointments) {
    if (appt.baby?.parents) {
      for (const parent of appt.baby.parents) {
        parentIds.add(parent.id);
      }
    }
  }

  // Increment noShowCount for each affected parent
  for (const parentId of parentIds) {
    await prisma.parent.update({
      where: { id: parentId },
      data: {
        noShowCount: { increment: 1 },
      },
    });
  }

  return appointments.length;
}

/**
 * Activate prepayment requirement for parents with 3+ no-shows
 */
async function activatePrepaymentRequirement(prisma: PrismaClient): Promise<number> {
  const result = await prisma.parent.updateMany({
    where: {
      noShowCount: { gte: 3 },
      requiresPrepayment: false,
    },
    data: {
      requiresPrepayment: true,
    },
  });

  return result.count;
}

/**
 * Deactivate babies older than 3 years
 */
async function deactivateOldBabies(prisma: PrismaClient): Promise<number> {
  const threeYearsAgo = new Date();
  threeYearsAgo.setUTCFullYear(threeYearsAgo.getUTCFullYear() - 3);

  const result = await prisma.baby.updateMany({
    where: {
      birthDate: { lt: threeYearsAgo },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}

/**
 * Expire pending messages older than 3 days
 */
async function expirePendingMessages(prisma: PrismaClient): Promise<number> {
  const now = new Date();

  const result = await prisma.pendingMessage.updateMany({
    where: {
      status: PendingMessageStatus.PENDING,
      expiresAt: { lt: now },
    },
    data: {
      status: PendingMessageStatus.EXPIRED,
    },
  });

  return result.count;
}

/**
 * Clear expired notifications
 */
async function clearExpiredNotifications(prisma: PrismaClient): Promise<number> {
  const now = new Date();

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });
    return result.count;
  } catch {
    // Table might not exist yet
    return 0;
  }
}
