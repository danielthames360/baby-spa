/**
 * Mesversary Messages Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Generates:
 * - Email + WhatsApp 3 days before mesversary
 * - Email + WhatsApp on mesversary day
 *
 * Rotates between 3 message versions based on month number.
 */

import {
  PrismaClient,
  PendingMessageCategory,
  RecipientType,
  TemplateCategory,
} from "@prisma/client";
import { emailService } from "@/lib/services/email-service";
import { templateService } from "@/lib/services/template-service";
import { pendingMessageService } from "@/lib/services/pending-message-service";
import { formatDateForDisplay } from "@/lib/utils/date-utils";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
  bookingUrl: string;
}

interface ParentData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface BabyParentWithParent {
  id: string;
  isPrimary: boolean;
  parent: ParentData;
}

interface BabyWithParents {
  id: string;
  name: string;
  birthDate: Date;
  lastMesversaryNotifiedMonth: number | null;
  parents: BabyParentWithParent[];
}

/**
 * Get parent data from BabyParent relation
 */
function getParentsFromBaby(parents: BabyParentWithParent[]): ParentData[] {
  return parents.map((bp) => bp.parent);
}

// Default configuration
const DEFAULT_CONFIG = {
  maxAgeMonths: 12,
  daysBefore: 3,
};

/**
 * Run mesversary messages job
 */
export async function runMesversaryMessages(
  prisma: PrismaClient,
  config: CountryConfig
): Promise<number> {
  let totalProcessed = 0;

  // Get template config
  const template = await templateService.getTemplateByKey("MESVERSARY_BEFORE");
  const templateConfig = (template?.config as { maxAgeMonths?: number; daysBefore?: number }) || {};
  const maxAgeMonths = templateConfig.maxAgeMonths || DEFAULT_CONFIG.maxAgeMonths;
  const daysBefore = templateConfig.daysBefore || DEFAULT_CONFIG.daysBefore;

  // Get all active babies with parents
  const babiesRaw = await prisma.baby.findMany({
    where: {
      isActive: true,
    },
    include: {
      parents: {
        include: {
          parent: true,
        },
      },
    },
  });
  // Filter to only babies with birthDate
  const babies = babiesRaw.filter((b) => b.birthDate !== null) as unknown as BabyWithParents[];

  const today = new Date();

  for (const baby of babies) {
    // Calculate baby's age in months
    const monthsOld = calculateMonthsOld(baby.birthDate, today);

    // Skip if baby is too old
    if (monthsOld > maxAgeMonths) continue;

    // Check for upcoming mesversary (3 days before)
    const upcomingMesversary = findUpcomingMesversary(
      baby.birthDate,
      today,
      daysBefore
    );

    if (upcomingMesversary) {
      // Skip if already notified for this month
      if (baby.lastMesversaryNotifiedMonth === upcomingMesversary.months) {
        continue;
      }

      // Check if baby has had at least one session (avoid spamming new registrations)
      const hasSession = await prisma.appointment.count({
        where: {
          babyId: baby.id,
          status: "COMPLETED",
        },
      });

      if (hasSession === 0) continue;

      const sent = await sendMesversaryNotification(
        prisma,
        baby,
        upcomingMesversary.months,
        upcomingMesversary.date,
        upcomingMesversary.isToday,
        config
      );

      if (sent) {
        totalProcessed++;
        // Update last notified month
        await prisma.baby.update({
          where: { id: baby.id },
          data: { lastMesversaryNotifiedMonth: upcomingMesversary.months },
        });
      }
    }
  }

  return totalProcessed;
}

/**
 * Calculate age in months
 */
function calculateMonthsOld(birthDate: Date, today: Date): number {
  const years = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const months = today.getUTCMonth() - birthDate.getUTCMonth();
  return years * 12 + months;
}

/**
 * Find if there's an upcoming mesversary in the next X days or today
 */
function findUpcomingMesversary(
  birthDate: Date,
  today: Date,
  daysBefore: number
): { months: number; date: Date; isToday: boolean } | null {
  const birthDay = birthDate.getUTCDate();

  // Check today
  if (today.getUTCDate() === birthDay) {
    const months = calculateMonthsOld(birthDate, today);
    if (months > 0) {
      return { months, date: today, isToday: true };
    }
  }

  // Check X days from now
  for (let i = 1; i <= daysBefore; i++) {
    const futureDate = new Date(today);
    futureDate.setUTCDate(futureDate.getUTCDate() + i);

    if (futureDate.getUTCDate() === birthDay) {
      // Calculate months at that future date
      const monthsAtDate = calculateMonthsOld(birthDate, futureDate);
      if (monthsAtDate > 0) {
        return { months: monthsAtDate, date: futureDate, isToday: false };
      }
    }
  }

  return null;
}

/**
 * Send mesversary notification (email + WhatsApp pending)
 */
async function sendMesversaryNotification(
  _prisma: PrismaClient,
  baby: BabyWithParents,
  months: number,
  mesversaryDate: Date,
  isToday: boolean,
  config: CountryConfig
): Promise<boolean> {
  const templateKey = isToday ? "MESVERSARY_DAY" : "MESVERSARY_BEFORE";
  const version = templateService.selectMesversaryVersion(months);

  let sentToAny = false;

  const parents = getParentsFromBaby(baby.parents);
  for (const parent of parents) {
    const variables = {
      parentName: parent.name,
      babyName: baby.name,
      months: months.toString(),
      date: formatDateForDisplay(mesversaryDate, config.locale),
      bookingUrl: config.bookingUrl,
    };

    const template = await templateService.processTemplateWithVariables(
      templateKey,
      variables,
      version
    );

    if (!template) continue;

    // Send email if available
    if (parent.email) {
      const emailResult = await emailService.sendStyledEmail({
        to: parent.email,
        subject: template.subject || `¡${baby.name} cumple ${months} meses!`,
        title: `🎂 ¡Feliz mesversario!`,
        body: template.body,
        templateKey,
        category: TemplateCategory.MESVERSARY,
        parentId: parent.id,
      });

      if (emailResult.success) {
        sentToAny = true;
      }
    }

    // Create WhatsApp pending message if phone available
    if (parent.phone) {
      // Check for existing pending message
      const exists = await pendingMessageService.messageExistsForEntity(
        "baby_mesversary",
        `${baby.id}_${months}`,
        PendingMessageCategory.MESVERSARY
      );

      if (!exists) {
        await pendingMessageService.createPendingMessage({
          category: PendingMessageCategory.MESVERSARY,
          templateKey,
          recipientType: RecipientType.BABY,
          recipientId: baby.id,
          recipientName: baby.name,
          recipientPhone: parent.phone,
          message: template.body,
          entityType: "baby_mesversary",
          entityId: `${baby.id}_${months}`,
          metadata: {
            parentId: parent.id,
            parentName: parent.name,
            months,
            isToday,
          },
          scheduledFor: new Date(),
        });
        sentToAny = true;
      }
    }
  }

  return sentToAny;
}
