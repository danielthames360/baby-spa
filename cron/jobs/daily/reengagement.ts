/**
 * Re-engagement Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Sends messages to parents who haven't visited in 45+ days:
 * - Email reminder
 * - WhatsApp pending message
 * - Internal notification for staff
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
import { calculateExactAge } from "@/lib/utils/age";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
  bookingUrl: string;
}

// Default configuration
const DEFAULT_CONFIG = {
  inactiveDays: 45,
  maxFrequencyDays: 60,
};

interface ParentWithBabies {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lastSessionAt: Date | null;
  lastReengagementAt: Date | null;
  babies: {
    baby: {
      id: string;
      name: string;
      birthDate: Date | null;
      isActive: boolean;
    };
  }[];
}

/**
 * Format age for cron context (without translation function)
 */
function formatAgeSimple(birthDate: Date): string {
  const age = calculateExactAge(birthDate);
  if (age.totalMonths < 1) {
    return `${age.days} días`;
  } else if (age.years < 1) {
    return `${age.totalMonths} meses`;
  } else {
    return `${age.years} año${age.years > 1 ? "s" : ""} y ${age.months} mes${age.months !== 1 ? "es" : ""}`;
  }
}

/**
 * Run re-engagement job
 */
export async function runReengagement(
  prisma: PrismaClient,
  config: CountryConfig
): Promise<number> {
  let totalProcessed = 0;

  // Get template config
  const template = await templateService.getTemplateByKey("REENGAGEMENT_45_DAYS");
  const templateConfig = (template?.config as { inactiveDays?: number; maxFrequencyDays?: number }) || {};
  const inactiveDays = templateConfig.inactiveDays || DEFAULT_CONFIG.inactiveDays;
  const maxFrequencyDays = templateConfig.maxFrequencyDays || DEFAULT_CONFIG.maxFrequencyDays;

  const today = new Date();
  const inactiveDate = new Date(today);
  inactiveDate.setUTCDate(inactiveDate.getUTCDate() - inactiveDays);

  const frequencyDate = new Date(today);
  frequencyDate.setUTCDate(frequencyDate.getUTCDate() - maxFrequencyDays);

  const futureDate = new Date(today);
  futureDate.setUTCDate(futureDate.getUTCDate() + 30);

  // Find parents who:
  // 1. Have had at least one completed appointment
  // 2. Last session was more than X days ago
  // 3. Haven't received re-engagement in the last Y days
  const parents = (await prisma.parent.findMany({
    where: {
      lastSessionAt: {
        not: null,
        lt: inactiveDate,
      },
      OR: [
        { lastReengagementAt: null },
        { lastReengagementAt: { lt: frequencyDate } },
      ],
    },
    include: {
      babies: {
        include: {
          baby: true,
        },
      },
    },
  })) as unknown as ParentWithBabies[];

  for (const parent of parents) {
    // Get active babies
    const activeBabies = parent.babies
      .map((bp) => bp.baby)
      .filter((b) => b.isActive);

    if (activeBabies.length === 0) continue;

    // Check if any baby has an upcoming appointment
    const hasUpcoming = await prisma.appointment.findFirst({
      where: {
        babyId: { in: activeBabies.map((b) => b.id) },
        date: { gte: today, lte: futureDate },
        status: { in: ["SCHEDULED", "PENDING_PAYMENT"] },
      },
    });

    if (hasUpcoming) continue;

    // Use the first active baby for the message
    const baby = activeBabies[0];

    const sent = await sendReengagementMessage(
      prisma,
      parent,
      baby,
      config
    );

    if (sent) {
      totalProcessed++;
      // Update last re-engagement date
      await prisma.parent.update({
        where: { id: parent.id },
        data: { lastReengagementAt: new Date() },
      });

      // Create internal notification for staff
      await createStaffNotification(prisma, parent, baby);
    }
  }

  return totalProcessed;
}

/**
 * Send re-engagement message (email + WhatsApp)
 */
async function sendReengagementMessage(
  prisma: PrismaClient,
  parent: ParentWithBabies,
  baby: ParentWithBabies["babies"][0]["baby"],
  config: CountryConfig
): Promise<boolean> {
  const lastVisitDate = parent.lastSessionAt
    ? formatDateForDisplay(parent.lastSessionAt, config.locale)
    : "hace tiempo";

  const currentAge = baby.birthDate
    ? formatAgeSimple(baby.birthDate)
    : "";

  const variables = {
    parentName: parent.name,
    babyName: baby.name,
    lastVisitDate,
    currentAge,
    bookingUrl: config.bookingUrl,
  };

  const template = await templateService.processTemplateWithVariables(
    "REENGAGEMENT_45_DAYS",
    variables
  );

  if (!template) return false;

  let sentToAny = false;

  // Send email if available
  if (parent.email) {
    const emailResult = await emailService.sendStyledEmail({
      to: parent.email,
      subject: template.subject || `${parent.name}, te extrañamos en Baby Spa`,
      title: `¡Hola ${parent.name}!`,
      body: template.body,
      templateKey: "REENGAGEMENT_45_DAYS",
      category: TemplateCategory.REENGAGEMENT,
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
      "parent_reengagement",
      parent.id,
      PendingMessageCategory.REENGAGEMENT
    );

    if (!exists) {
      await pendingMessageService.createPendingMessage({
        category: PendingMessageCategory.REENGAGEMENT,
        templateKey: "REENGAGEMENT_45_DAYS",
        recipientType: RecipientType.PARENT,
        recipientId: parent.id,
        recipientName: parent.name,
        recipientPhone: parent.phone,
        message: template.body,
        entityType: "parent_reengagement",
        entityId: parent.id,
        metadata: {
          babyId: baby.id,
          babyName: baby.name,
          lastVisit: parent.lastSessionAt?.toISOString(),
        },
        scheduledFor: new Date(),
      });
      sentToAny = true;
    }
  }

  return sentToAny;
}

/**
 * Create internal notification for staff follow-up
 */
async function createStaffNotification(
  prisma: PrismaClient,
  parent: ParentWithBabies,
  baby: ParentWithBabies["babies"][0]["baby"]
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type: "REENGAGEMENT_ALERT",
        title: "Cliente inactivo requiere seguimiento",
        message: `${parent.name} no ha visitado en más de 45 días. Último bebé activo: ${baby.name}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  } catch {
    console.log(
      `[Reengagement] Staff notification: ${parent.name} inactive with ${baby.name}`
    );
  }
}
