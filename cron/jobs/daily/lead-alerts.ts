/**
 * Lead Alerts Job
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Creates alerts for:
 * - Leads whose due date has passed (may have given birth)
 */

import { PrismaClient, EventType } from "@prisma/client";

interface CountryConfig {
  timezone: string;
  utcOffset: number;
  locale: string;
}

interface EventParticipantWithEvent {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  expectedDueDate: Date | null;
  notes: string | null;
  followUpAt: Date | null;
  parent: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  event: {
    id: string;
    name: string;
    type: EventType;
  };
}

/**
 * Run lead alerts job
 */
export async function runLeadAlerts(
  prisma: PrismaClient,
  _config: CountryConfig
): Promise<number> {
  let totalProcessed = 0;

  const today = new Date();

  // Find event participants (leads from PARENTS events) whose due date has passed
  // and haven't been followed up yet
  const leads = (await prisma.eventParticipant.findMany({
    where: {
      expectedDueDate: {
        not: null,
        lt: today, // Due date has passed
      },
      OR: [
        { followUpAt: null },
        {
          followUpAt: {
            lt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // Last follow-up was 30+ days ago
          },
        },
      ],
      event: {
        type: EventType.PARENTS, // Only leads from parent events
      },
    },
    include: {
      event: true,
      parent: true,
    },
  })) as unknown as EventParticipantWithEvent[];

  for (const lead of leads) {
    const alertCreated = await createLeadAlert(prisma, lead);
    if (alertCreated) {
      totalProcessed++;

      // Update follow-up date
      await prisma.eventParticipant.update({
        where: { id: lead.id },
        data: { followUpAt: new Date() },
      });
    }
  }

  return totalProcessed;
}

/**
 * Create alert for lead that may have given birth
 */
async function createLeadAlert(
  prisma: PrismaClient,
  lead: EventParticipantWithEvent
): Promise<boolean> {
  // Get contact info from direct fields or parent relation
  const name = lead.name || lead.parent?.name || "Sin nombre";
  const phone = lead.phone || lead.parent?.phone;
  const email = lead.email || lead.parent?.email;

  const dueDateStr = lead.expectedDueDate
    ? lead.expectedDueDate.toISOString().split("T")[0]
    : "No especificada";

  try {
    await prisma.notification.create({
      data: {
        type: "LEAD_DUE_DATE",
        title: "Lead puede haber dado a luz",
        message: `${name} (${phone || email || "Sin contacto"}) - Fecha probable: ${dueDateStr}. Evento: ${lead.event.name}`,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        metadata: {
          leadId: lead.id,
          leadName: name,
          leadPhone: phone,
          leadEmail: email,
          dueDate: dueDateStr,
          eventId: lead.event.id,
          eventName: lead.event.name,
        },
      },
    });
    return true;
  } catch (error) {
    console.error(`[LeadAlerts] Failed to create notification for ${name}:`, error);
    return false;
  }
}

/**
 * Send welcome email to new lead (called from event registration)
 * This is not a cron job but can be called manually
 */
export async function sendLeadWelcomeEmail(
  _prisma: PrismaClient,
  lead: { id: string; name: string; email: string | null },
  eventName: string,
  config: CountryConfig & { whatsappNumber: string }
): Promise<boolean> {
  if (!lead.email) return false;

  // Import services lazily to avoid circular dependencies
  const { emailService } = await import("@/lib/services/email-service");
  const { templateService } = await import("@/lib/services/template-service");
  const { TemplateCategory } = await import("@prisma/client");

  const variables = {
    parentName: lead.name,
    eventName,
    whatsappNumber: config.whatsappNumber,
  };

  const template = await templateService.processTemplateWithVariables(
    "LEAD_WELCOME",
    variables
  );

  if (!template) return false;

  const result = await emailService.sendStyledEmail({
    to: lead.email,
    subject: template.subject || "¡Bienvenida a la familia Baby Spa!",
    title: `¡Bienvenida ${lead.name}!`,
    body: template.body,
    templateKey: "LEAD_WELCOME",
    category: TemplateCategory.LEAD,
  });

  return result.success;
}
