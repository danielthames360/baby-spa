/**
 * Daily Summary Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Sends daily summary email to owners with:
 * - Today's appointments
 * - Pending WhatsApp messages count
 * - Yesterday's email stats
 * - Mesversaries this week
 * - Attention items (inactive clients, leads, email issues)
 */

import {
  PrismaClient,
  AppointmentStatus,
  PendingMessageStatus,
  TemplateCategory,
} from "@prisma/client";
import { emailService } from "@/lib/services/email-service";
import { templateService } from "@/lib/services/template-service";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  formatDateForDisplay,
} from "@/lib/utils/date-utils";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
}

/**
 * Send daily summary to owners
 */
export async function sendDailySummary(
  prisma: PrismaClient,
  config: CountryConfig
): Promise<void> {
  // Get owners who want daily summary
  const owners = await prisma.user.findMany({
    where: {
      receiveDailySummary: true,
      dailySummaryEmail: { not: null },
      isActive: true,
    },
  });

  if (owners.length === 0) {
    console.log("[DailySummary] No owners configured for daily summary");
    return;
  }

  // Gather data
  const today = new Date();
  const startOfDay = getStartOfDayUTC(today);
  const endOfDay = getEndOfDayUTC(today);

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const startOfYesterday = getStartOfDayUTC(yesterday);
  const endOfYesterday = getEndOfDayUTC(yesterday);

  // 1. Today's appointments
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING_PAYMENT] },
    },
    include: {
      baby: { select: { name: true } },
      selectedPackage: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // 2. Pending WhatsApp messages
  const pendingMessagesCount = await prisma.pendingMessage.count({
    where: {
      status: PendingMessageStatus.PENDING,
      scheduledFor: { lte: today },
      expiresAt: { gt: today },
    },
  });

  // 3. Yesterday's email stats
  const yesterdayEmails = await prisma.emailLog.findMany({
    where: {
      sentAt: { gte: startOfYesterday, lte: endOfYesterday },
    },
    select: { status: true },
  });

  // 4. Mesversaries this week
  const weekFromNow = new Date(today);
  weekFromNow.setUTCDate(weekFromNow.getUTCDate() + 7);

  const babiesRaw = await prisma.baby.findMany({
    where: {
      isActive: true,
    },
    select: {
      name: true,
      birthDate: true,
    },
  });
  const babies = babiesRaw.filter((b) => b.birthDate !== null);

  const mesversariesThisWeek = findMesversariesInRange(babies, today, weekFromNow);

  // 5. Attention items
  const attentionItems: string[] = [];

  // Check for bounced emails
  const bouncedEmailParents = await prisma.parent.count({
    where: { emailBounceCount: { gte: 2 } },
  });
  if (bouncedEmailParents > 0) {
    attentionItems.push(`${bouncedEmailParents} padre(s) con problemas de email`);
  }

  // Check for leads due
  const leadsDue = await prisma.eventParticipant.count({
    where: {
      expectedDueDate: { lt: today },
      followUpAt: null,
    },
  });
  if (leadsDue > 0) {
    attentionItems.push(`${leadsDue} lead(s) que pueden haber dado a luz`);
  }

  // Format the summary
  const dateStr = formatDateForDisplay(today, config.locale);

  const appointmentsList =
    todayAppointments.length > 0
      ? todayAppointments
          .map(
            (a) =>
              `• ${a.startTime} - ${a.baby?.name || "Sesión"} - ${a.selectedPackage?.name || "Servicio"} ${a.status === "PENDING_PAYMENT" ? "(Pago pendiente)" : ""}`
          )
          .join("\n")
      : "No hay citas programadas";

  const emailsSentYesterday = yesterdayEmails.length;
  const emailsDelivered = yesterdayEmails.filter(
    (e) => e.status === "DELIVERED" || e.status === "OPENED"
  ).length;
  const emailsBounced = yesterdayEmails.filter((e) => e.status === "BOUNCED").length;

  const mesversaryList =
    mesversariesThisWeek.length > 0
      ? mesversariesThisWeek
          .map((m) => `• ${m.name} cumple ${m.months} meses el ${m.dateStr}`)
          .join("\n")
      : "No hay mesversarios esta semana";

  const attentionList =
    attentionItems.length > 0
      ? attentionItems.map((a) => `• ${a}`).join("\n")
      : "Sin alertas";

  const variables = {
    date: dateStr,
    appointmentCount: todayAppointments.length.toString(),
    appointmentsList,
    pendingMessagesCount: pendingMessagesCount.toString(),
    emailsSentYesterday: `${emailsSentYesterday} (${emailsDelivered} entregados, ${emailsBounced} rebotados)`,
    mesversaryList,
    attentionList,
  };

  const template = await templateService.processTemplateWithVariables(
    "DAILY_SUMMARY",
    variables
  );

  if (!template) {
    console.warn("[DailySummary] Template DAILY_SUMMARY not found");
    return;
  }

  // Send to each owner
  for (const owner of owners) {
    if (!owner.dailySummaryEmail) continue;

    await emailService.sendStyledEmail({
      to: owner.dailySummaryEmail,
      subject: template.subject || `Resumen del día - Baby Spa ${dateStr}`,
      title: `📊 Resumen del día - ${dateStr}`,
      body: template.body,
      templateKey: "DAILY_SUMMARY",
      category: TemplateCategory.ADMIN,
    });
  }
}

/**
 * Find mesversaries in a date range
 */
function findMesversariesInRange(
  babies: { name: string; birthDate: Date | null }[],
  startDate: Date,
  endDate: Date
): { name: string; months: number; dateStr: string }[] {
  const results: { name: string; months: number; dateStr: string }[] = [];

  for (const baby of babies) {
    if (!baby.birthDate) continue;

    const birthDay = baby.birthDate.getUTCDate();

    // Check each day in range
    const checkDate = new Date(startDate);
    while (checkDate <= endDate) {
      if (checkDate.getUTCDate() === birthDay) {
        const months = calculateMonthsOld(baby.birthDate, checkDate);
        if (months > 0 && months <= 12) {
          results.push({
            name: baby.name,
            months,
            dateStr: checkDate.toISOString().split("T")[0],
          });
          break; // Only one mesversary per baby in range
        }
      }
      checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    }
  }

  return results;
}

/**
 * Calculate months old
 */
function calculateMonthsOld(birthDate: Date, today: Date): number {
  const years = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const months = today.getUTCMonth() - birthDate.getUTCMonth();
  return years * 12 + months;
}
