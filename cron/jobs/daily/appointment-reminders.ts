/**
 * Appointment Reminders Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Generates:
 * - Email 24h before appointment
 * - WhatsApp (pending) same day
 * - WhatsApp (pending) for payment reminder 48h before
 */

import { PrismaClient, AppointmentStatus, PendingMessageCategory, RecipientType } from "@prisma/client";
import { emailService } from "@/lib/services/email-service";
import { templateService } from "@/lib/services/template-service";
import { pendingMessageService } from "@/lib/services/pending-message-service";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  formatDateForDisplay,
} from "@/lib/utils/date-utils";
import { TemplateCategory } from "@prisma/client";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
  portalUrl: string;
  address: string;
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

interface AppointmentWithRelations {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reminder24hSent: boolean;
  reminderDaySent: boolean;
  paymentReminderSent: boolean;
  baby: {
    id: string;
    name: string;
    parents: BabyParentWithParent[];
  } | null;
  selectedPackage: {
    name: string;
    requiresAdvancePayment: boolean;
    price: number | { toNumber: () => number };
  } | null;
}

/**
 * Get parent data from BabyParent relation
 */
function getParentsFromBaby(baby: AppointmentWithRelations["baby"]): ParentData[] {
  if (!baby) return [];
  return baby.parents.map((bp) => bp.parent);
}

/**
 * Run all appointment reminder jobs
 */
export async function runAppointmentReminders(
  prisma: PrismaClient,
  config: CountryConfig
): Promise<number> {
  let totalProcessed = 0;

  // Get today and tomorrow dates
  const now = new Date();
  const today = getStartOfDayUTC(now);
  const todayEnd = getEndOfDayUTC(now);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowEnd = getEndOfDayUTC(tomorrow);

  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setUTCDate(twoDaysFromNow.getUTCDate() + 2);
  const twoDaysEnd = getEndOfDayUTC(twoDaysFromNow);

  // Fetch all appointment types in parallel (async-parallel best practice)
  console.log("[AppointmentReminders] Fetching appointments...");

  const appointmentInclude = {
    baby: {
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    },
    selectedPackage: true,
  };

  const [tomorrowAppts, todayAppts, paymentAppts] = await Promise.all([
    // 1. Email 24h reminders (appointments tomorrow)
    prisma.appointment.findMany({
      where: {
        date: { gte: tomorrow, lte: tomorrowEnd },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING_PAYMENT] },
        reminder24hSent: false,
        baby: { isNot: null },
      },
      include: appointmentInclude,
    }),
    // 2. WhatsApp same-day reminders (appointments today)
    prisma.appointment.findMany({
      where: {
        date: { gte: today, lte: todayEnd },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.PENDING_PAYMENT] },
        reminderDaySent: false,
        baby: { isNot: null },
      },
      include: appointmentInclude,
    }),
    // 3. Payment reminders (48h before, requires advance payment)
    prisma.appointment.findMany({
      where: {
        date: { gte: twoDaysFromNow, lte: twoDaysEnd },
        status: AppointmentStatus.PENDING_PAYMENT,
        paymentReminderSent: false,
        baby: { isNot: null },
        selectedPackage: {
          requiresAdvancePayment: true,
        },
      },
      include: appointmentInclude,
    }),
  ]) as unknown as [AppointmentWithRelations[], AppointmentWithRelations[], AppointmentWithRelations[]];

  // Process 24h email reminders
  console.log(`[AppointmentReminders] Processing ${tomorrowAppts.length} 24h email reminders...`);
  for (const appt of tomorrowAppts) {
    const sent = await send24hEmailReminder(prisma, appt, config);
    if (sent) totalProcessed++;
  }

  // Process same-day WhatsApp reminders (grouped by parent)
  console.log(`[AppointmentReminders] Processing ${todayAppts.length} same-day WhatsApp reminders...`);
  const apptsByParent = groupAppointmentsByParent(todayAppts);
  for (const [parentId, appointments] of Object.entries(apptsByParent)) {
    const sent = await sendSameDayWhatsAppReminder(prisma, parentId, appointments, config);
    if (sent) totalProcessed++;
  }

  // Process payment reminders
  console.log(`[AppointmentReminders] Processing ${paymentAppts.length} payment reminders...`);
  for (const appt of paymentAppts) {
    const sent = await sendPaymentReminder(prisma, appt, config);
    if (sent) totalProcessed++;
  }

  return totalProcessed;
}

/**
 * Send 24h email reminder
 */
async function send24hEmailReminder(
  prisma: PrismaClient,
  appt: AppointmentWithRelations,
  config: CountryConfig
): Promise<boolean> {
  if (!appt.baby) return false;

  const parents = getParentsFromBaby(appt.baby);
  for (const parent of parents) {
    if (!parent.email) continue;

    const variables = {
      parentName: parent.name,
      babyName: appt.baby.name,
      date: formatDateForDisplay(appt.date, config.locale),
      time: appt.startTime,
      serviceName: appt.selectedPackage?.name || "Sesión",
      address: config.address,
      portalUrl: config.portalUrl,
    };

    const template = await templateService.processTemplateWithVariables(
      "APPOINTMENT_REMINDER_24H",
      variables
    );

    if (!template) {
      console.warn("[AppointmentReminders] Template APPOINTMENT_REMINDER_24H not found");
      continue;
    }

    const result = await emailService.sendStyledEmail({
      to: parent.email,
      subject: template.subject || "Recordatorio: Cita mañana en Baby Spa",
      title: `¡Hola ${parent.name}!`,
      body: template.body,
      templateKey: "APPOINTMENT_REMINDER_24H",
      category: TemplateCategory.APPOINTMENT,
      parentId: parent.id,
    });

    if (result.success) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminder24hSent: true },
      });
      return true;
    }
  }

  return false;
}

/**
 * Group appointments by parent for combined messages
 */
function groupAppointmentsByParent(
  appointments: AppointmentWithRelations[]
): Record<string, AppointmentWithRelations[]> {
  const grouped: Record<string, AppointmentWithRelations[]> = {};

  for (const appt of appointments) {
    if (!appt.baby) continue;
    const parents = getParentsFromBaby(appt.baby);
    for (const parent of parents) {
      if (!parent.phone) continue;
      if (!grouped[parent.id]) {
        grouped[parent.id] = [];
      }
      grouped[parent.id].push(appt);
    }
  }

  return grouped;
}

/**
 * Send same-day WhatsApp reminder (creates pending message)
 */
async function sendSameDayWhatsAppReminder(
  prisma: PrismaClient,
  parentId: string,
  appointments: AppointmentWithRelations[],
  config: CountryConfig
): Promise<boolean> {
  const parents = getParentsFromBaby(appointments[0]?.baby);
  const parent = parents.find((p) => p.id === parentId);
  if (!parent?.phone) return false;

  let message: string;
  let templateKey: string;

  if (appointments.length === 1) {
    const appt = appointments[0];
    const variables = {
      parentName: parent.name,
      babyName: appt.baby!.name,
      time: appt.startTime,
      serviceName: appt.selectedPackage?.name || "Sesión",
    };

    const template = await templateService.processTemplateWithVariables(
      "APPOINTMENT_DAY_WHATSAPP",
      variables
    );

    if (!template) return false;
    message = template.body;
    templateKey = "APPOINTMENT_DAY_WHATSAPP";
  } else {
    // Multiple appointments - use combined template
    const appointmentsList = appointments
      .map(
        (a) =>
          `${a.startTime} - ${a.baby!.name} - ${a.selectedPackage?.name || "Sesión"}`
      )
      .join("\n");

    const variables = {
      parentName: parent.name,
      count: appointments.length.toString(),
      appointmentsList,
    };

    const template = await templateService.processTemplateWithVariables(
      "APPOINTMENT_MULTIPLE",
      variables
    );

    if (!template) return false;
    message = template.body;
    templateKey = "APPOINTMENT_MULTIPLE";
  }

  // Create pending message
  await pendingMessageService.createPendingMessage({
    category: PendingMessageCategory.APPOINTMENT_REMINDER,
    templateKey,
    recipientType: RecipientType.PARENT,
    recipientId: parentId,
    recipientName: parent.name,
    recipientPhone: parent.phone,
    message,
    entityType: "appointment",
    entityId: appointments[0].id,
    metadata: {
      appointmentCount: appointments.length,
      appointmentIds: appointments.map((a) => a.id),
    },
    scheduledFor: new Date(),
  });

  // Mark all appointments as reminded
  for (const appt of appointments) {
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { reminderDaySent: true },
    });
  }

  return true;
}

/**
 * Send payment reminder (creates pending message)
 */
async function sendPaymentReminder(
  prisma: PrismaClient,
  appt: AppointmentWithRelations,
  config: CountryConfig
): Promise<boolean> {
  if (!appt.baby) return false;

  const parents = getParentsFromBaby(appt.baby);
  for (const parent of parents) {
    if (!parent.phone) continue;

    const price = appt.selectedPackage?.price;
    const amount =
      typeof price === "object" && "toNumber" in price
        ? price.toNumber()
        : typeof price === "number"
          ? price
          : 0;

    const variables = {
      parentName: parent.name,
      babyName: appt.baby.name,
      date: formatDateForDisplay(appt.date, config.locale),
      time: appt.startTime,
      amount: `${amount} ${config.locale === "pt-BR" ? "BRL" : "BOB"}`,
    };

    const template = await templateService.processTemplateWithVariables(
      "PAYMENT_REMINDER_48H",
      variables
    );

    if (!template) continue;

    // Check if message already exists for this appointment
    const exists = await pendingMessageService.messageExistsForEntity(
      "appointment",
      appt.id,
      PendingMessageCategory.PAYMENT_REMINDER
    );

    if (exists) continue;

    await pendingMessageService.createPendingMessage({
      category: PendingMessageCategory.PAYMENT_REMINDER,
      templateKey: "PAYMENT_REMINDER_48H",
      recipientType: RecipientType.PARENT,
      recipientId: parent.id,
      recipientName: parent.name,
      recipientPhone: parent.phone,
      message: template.body,
      entityType: "appointment",
      entityId: appt.id,
      scheduledFor: new Date(),
    });

    await prisma.appointment.update({
      where: { id: appt.id },
      data: { paymentReminderSent: true },
    });

    return true;
  }

  return false;
}
