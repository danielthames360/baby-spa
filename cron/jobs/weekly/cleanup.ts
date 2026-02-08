/**
 * Weekly Cleanup Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Weekly cleanup tasks (runs on Mondays):
 * - Delete old sent/skipped/expired WhatsApp messages (30+ days)
 * - Delete old email logs (90+ days)
 * - Delete old activity logs (90+ days)
 */

import { PrismaClient, PendingMessageStatus } from "@prisma/client";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
}

interface CleanupResult {
  messagesDeleted: number;
  emailLogsDeleted: number;
  activityDeleted: number;
}

/**
 * Run weekly cleanup job
 */
export async function runWeeklyCleanup(
  prisma: PrismaClient,
  _config: CountryConfig
): Promise<CleanupResult> {
  const result: CleanupResult = {
    messagesDeleted: 0,
    emailLogsDeleted: 0,
    activityDeleted: 0,
  };

  // 1. Delete old WhatsApp messages (30+ days old, non-pending)
  result.messagesDeleted = await cleanupOldMessages(prisma, 30);

  // 2. Delete old email logs (90+ days)
  result.emailLogsDeleted = await cleanupOldEmailLogs(prisma, 90);

  // 3. Delete old activity logs (90+ days)
  result.activityDeleted = await cleanupOldActivity(prisma, 90);

  console.log("[WeeklyCleanup] Results:", result);

  return result;
}

/**
 * Delete old pending messages that are no longer needed
 */
async function cleanupOldMessages(
  prisma: PrismaClient,
  olderThanDays: number
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - olderThanDays);

  const result = await prisma.pendingMessage.deleteMany({
    where: {
      status: {
        in: [
          PendingMessageStatus.SENT,
          PendingMessageStatus.SKIPPED,
          PendingMessageStatus.EXPIRED,
        ],
      },
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Delete old email logs
 */
async function cleanupOldEmailLogs(
  prisma: PrismaClient,
  olderThanDays: number
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - olderThanDays);

  const result = await prisma.emailLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Delete old activity records
 */
async function cleanupOldActivity(
  prisma: PrismaClient,
  olderThanDays: number
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - olderThanDays);

  try {
    const result = await prisma.activity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
    return result.count;
  } catch {
    // Table might not exist
    return 0;
  }
}
