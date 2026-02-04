/**
 * Pending Message Service - WhatsApp Queue Management
 * Fase 11: Cron Jobs y Mensajería Automatizada
 */

import { prisma } from "@/lib/db";
import {
  PendingMessageCategory,
  PendingMessageStatus,
  RecipientType,
  Prisma,
} from "@prisma/client";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";

interface CreatePendingMessageParams {
  category: PendingMessageCategory;
  templateKey: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  scheduledFor: Date;
}

/**
 * Create a pending WhatsApp message
 */
export async function createPendingMessage(params: CreatePendingMessageParams) {
  const {
    category,
    templateKey,
    recipientType,
    recipientId,
    recipientName,
    recipientPhone,
    message,
    entityType,
    entityId,
    metadata,
    scheduledFor,
  } = params;

  // Expiration is 3 days after scheduled time
  const expiresAt = new Date(scheduledFor);
  expiresAt.setDate(expiresAt.getDate() + 3);

  return prisma.pendingMessage.create({
    data: {
      category,
      templateKey,
      recipientType,
      recipientId,
      recipientName,
      recipientPhone,
      message,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonValue,
      scheduledFor,
      expiresAt,
    },
  });
}

/**
 * Get pending messages for display (PENDING status, scheduled for today or before)
 */
export async function getPendingMessages(options?: {
  category?: PendingMessageCategory;
  limit?: number;
  offset?: number;
}) {
  const { category, limit = 50, offset = 0 } = options || {};

  const now = new Date();

  const where: Prisma.PendingMessageWhereInput = {
    status: PendingMessageStatus.PENDING,
    scheduledFor: { lte: now },
    expiresAt: { gt: now },
  };

  if (category) {
    where.category = category;
  }

  const [messages, total] = await Promise.all([
    prisma.pendingMessage.findMany({
      where,
      orderBy: [{ scheduledFor: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.pendingMessage.count({ where }),
  ]);

  return { messages, total };
}

/**
 * Get count of pending messages (for badge)
 */
export async function getPendingMessagesCount(): Promise<number> {
  const now = new Date();

  return prisma.pendingMessage.count({
    where: {
      status: PendingMessageStatus.PENDING,
      scheduledFor: { lte: now },
      expiresAt: { gt: now },
    },
  });
}

/**
 * Get pending messages grouped by category
 */
export async function getPendingMessagesGroupedByCategory() {
  const now = new Date();

  const messages = await prisma.pendingMessage.groupBy({
    by: ["category"],
    where: {
      status: PendingMessageStatus.PENDING,
      scheduledFor: { lte: now },
      expiresAt: { gt: now },
    },
    _count: true,
  });

  return messages.reduce(
    (acc, item) => {
      acc[item.category] = item._count;
      return acc;
    },
    {} as Record<PendingMessageCategory, number>
  );
}

/**
 * Mark a message as sent
 */
export async function markAsSent(messageId: string, sentById: string) {
  return prisma.pendingMessage.update({
    where: { id: messageId },
    data: {
      status: PendingMessageStatus.SENT,
      sentAt: new Date(),
      sentById,
    },
  });
}

/**
 * Mark a message as skipped
 */
export async function markAsSkipped(
  messageId: string,
  sentById: string,
  reason?: string
) {
  return prisma.pendingMessage.update({
    where: { id: messageId },
    data: {
      status: PendingMessageStatus.SKIPPED,
      sentAt: new Date(),
      sentById,
      skipReason: reason,
    },
  });
}

/**
 * Expire old messages (called by cron)
 */
export async function expireOldMessages(): Promise<number> {
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
 * Delete old sent/skipped/expired messages (cleanup job)
 */
export async function cleanupOldMessages(olderThanDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

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
 * Check if a message already exists for the same entity
 * (to avoid duplicates)
 */
export async function messageExistsForEntity(
  entityType: string,
  entityId: string,
  category: PendingMessageCategory
): Promise<boolean> {
  const count = await prisma.pendingMessage.count({
    where: {
      entityType,
      entityId,
      category,
      status: PendingMessageStatus.PENDING,
    },
  });

  return count > 0;
}

/**
 * Delete pending messages for an entity (e.g., when appointment is cancelled)
 */
export async function deletePendingMessagesForEntity(
  entityType: string,
  entityId: string
): Promise<number> {
  const result = await prisma.pendingMessage.deleteMany({
    where: {
      entityType,
      entityId,
      status: PendingMessageStatus.PENDING,
    },
  });

  return result.count;
}

/**
 * Get messages created today (for summary)
 */
export async function getMessagesCreatedToday() {
  const now = new Date();
  const startOfDay = getStartOfDayUTC(now);
  const endOfDay = getEndOfDayUTC(now);

  return prisma.pendingMessage.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Generate WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  // Remove any non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, "");

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export const pendingMessageService = {
  createPendingMessage,
  getPendingMessages,
  getPendingMessagesCount,
  getPendingMessagesGroupedByCategory,
  markAsSent,
  markAsSkipped,
  expireOldMessages,
  cleanupOldMessages,
  messageExistsForEntity,
  deletePendingMessagesForEntity,
  getMessagesCreatedToday,
  generateWhatsAppUrl,
};
