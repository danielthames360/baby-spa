/**
 * Email Service - Resend Integration
 * Fase 11: Cron Jobs y Mensajería Automatizada
 */

import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { EmailStatus, TemplateCategory } from "@prisma/client";
import {
  generateAppointmentConfirmationEmail,
  generateAppointmentRescheduledEmail,
  generateGoogleCalendarLink,
  generateOutlookCalendarLink,
} from "@/lib/utils/email-template";
import { formatDateForDisplay } from "@/lib/utils/date-utils";

// Initialize Resend client lazily to avoid build errors
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EmailService] RESEND_API_KEY not configured");
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

// Default sender email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Baby Spa <noreply@babyspa.online>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  templateKey: string;
  category: TemplateCategory;
  parentId?: string;
}

interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Send an email via Resend and log it
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, templateKey, category, parentId } = params;

  const resend = getResendClient();

  if (!resend) {
    console.warn("[EmailService] Resend not configured, email not sent");
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    // Send email via Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (response.error) {
      console.error("[EmailService] Resend error:", response.error);
      return {
        success: false,
        error: response.error.message,
      };
    }

    // Log the email
    await prisma.emailLog.create({
      data: {
        resendId: response.data?.id || `local-${Date.now()}`,
        toEmail: to,
        parentId,
        templateKey,
        category,
        status: EmailStatus.SENT,
        subject,
      },
    });

    return {
      success: true,
      resendId: response.data?.id,
    };
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process variables in a template string
 * Variables are in format {variableName}
 */
export function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Update email status from Resend webhook
 */
export async function updateEmailStatus(
  resendId: string,
  event: string,
  timestamp: Date,
  bounceInfo?: { type?: string; reason?: string }
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  switch (event) {
    case "email.delivered":
      updateData.status = EmailStatus.DELIVERED;
      updateData.deliveredAt = timestamp;
      break;

    case "email.opened":
      updateData.status = EmailStatus.OPENED;
      updateData.openedAt = timestamp;
      break;

    case "email.bounced":
      updateData.status = EmailStatus.BOUNCED;
      updateData.bouncedAt = timestamp;
      updateData.bounceType = bounceInfo?.type;
      updateData.bounceReason = bounceInfo?.reason;
      break;

    case "email.complained":
      updateData.status = EmailStatus.COMPLAINED;
      updateData.complainedAt = timestamp;
      break;

    default:
      console.log(`[EmailService] Unknown event type: ${event}`);
      return;
  }

  try {
    const emailLog = await prisma.emailLog.update({
      where: { resendId },
      data: updateData,
    });

    // If bounced, increment parent's bounce count
    if (event === "email.bounced" && emailLog.parentId) {
      await prisma.parent.update({
        where: { id: emailLog.parentId },
        data: {
          emailBounceCount: { increment: 1 },
        },
      });
    }
  } catch (error) {
    console.error(`[EmailService] Failed to update email status for ${resendId}:`, error);
  }
}

/**
 * Get email statistics for a date range
 */
export async function getEmailStats(
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  delivered: number;
  opened: number;
  bounced: number;
  byCategory: Record<string, number>;
}> {
  const logs = await prisma.emailLog.findMany({
    where: {
      sentAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
      category: true,
    },
  });

  const stats = {
    total: logs.length,
    delivered: 0,
    opened: 0,
    bounced: 0,
    byCategory: {} as Record<string, number>,
  };

  for (const log of logs) {
    // Count by status
    if (log.status === EmailStatus.DELIVERED || log.status === EmailStatus.OPENED) {
      stats.delivered++;
    }
    if (log.status === EmailStatus.OPENED) {
      stats.opened++;
    }
    if (log.status === EmailStatus.BOUNCED) {
      stats.bounced++;
    }

    // Count by category
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
  }

  return stats;
}

/**
 * Get emails with problems (bounced or complained) for a parent
 */
export async function getProblematicEmails(parentId: string) {
  return prisma.emailLog.findMany({
    where: {
      parentId,
      status: {
        in: [EmailStatus.BOUNCED, EmailStatus.COMPLAINED],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

/**
 * Check if a parent has email problems (2+ bounces)
 */
export async function hasEmailProblems(parentId: string): Promise<boolean> {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { emailBounceCount: true },
  });

  return (parent?.emailBounceCount ?? 0) >= 2;
}

/**
 * Reset email bounce count (when staff corrects email)
 */
export async function resetEmailBounceCount(parentId: string): Promise<void> {
  await prisma.parent.update({
    where: { id: parentId },
    data: { emailBounceCount: 0 },
  });
}

/**
 * Retry a failed email
 */
export async function retryEmail(emailLogId: string): Promise<SendEmailResult> {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
    include: { parent: true },
  });

  if (!emailLog) {
    return { success: false, error: "Email log not found" };
  }

  if (emailLog.retryCount >= 3) {
    return { success: false, error: "Max retry attempts reached" };
  }

  // Update retry count
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      retryCount: { increment: 1 },
      lastRetryAt: new Date(),
    },
  });

  // Get the template to resend
  const template = await prisma.messageTemplate.findUnique({
    where: { key: emailLog.templateKey },
  });

  if (!template || !template.emailEnabled) {
    return { success: false, error: "Template not found or email disabled" };
  }

  // Resend the email
  return sendEmail({
    to: emailLog.toEmail,
    subject: emailLog.subject || template.subject || "Baby Spa",
    html: template.body, // Note: variables already processed, this is a simplified retry
    templateKey: emailLog.templateKey,
    category: emailLog.category,
    parentId: emailLog.parentId || undefined,
  });
}

// ============================================================
// APPOINTMENT EMAIL FUNCTIONS
// ============================================================

interface AppointmentEmailData {
  parentId: string;
  parentName: string;
  parentEmail: string;
  babyName?: string;
  serviceName: string;
  date: Date;
  time: string;
  duration: number; // in minutes
}

interface RescheduleEmailData extends AppointmentEmailData {
  oldDate: Date;
  oldTime: string;
}

/**
 * Get system settings for email configuration
 */
async function getEmailConfig() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  // Determine portal URL based on environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bo.babyspa.online";

  return {
    logoUrl: `${baseUrl}/images/logoBabySpa.png`,
    businessName: "Baby Spa",
    businessAddress: settings?.businessAddress || undefined,
    whatsappNumber: settings?.whatsappNumber || undefined,
    whatsappCountryCode: settings?.whatsappCountryCode || "+591",
    instagramHandle: settings?.instagramHandle || undefined,
    portalUrl: `${baseUrl}/portal`,
  };
}

/**
 * Get timezone offset in hours from WhatsApp country code
 * This is a temporary solution until timezone is added to system settings
 */
function getTimezoneOffsetFromCountryCode(countryCode: string): number {
  const offsets: Record<string, number> = {
    "+591": -4,  // Bolivia UTC-4
    "+55": -3,   // Brazil (São Paulo) UTC-3
  };
  return offsets[countryCode] ?? -4; // Default to Bolivia
}

/**
 * Create calendar event details from appointment data
 */
function createCalendarEvent(
  data: AppointmentEmailData,
  config: { businessAddress?: string; whatsappCountryCode?: string }
): {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
} {
  const title = data.babyName
    ? `Baby Spa - ${data.babyName} - ${data.serviceName}`
    : `Baby Spa - ${data.serviceName}`;

  const description = data.babyName
    ? `Cita de hidroterapia para ${data.babyName}. Servicio: ${data.serviceName}. Recomendaciones: Llegar 10 minutos antes, traer pañal acuático.`
    : `Cita en Baby Spa. Servicio: ${data.serviceName}.`;

  // Parse time and create start/end dates
  // The time is in local business time (e.g., "15:00" means 15:00 Bolivia/Brazil)
  // We need to convert to UTC for calendar links to work correctly
  const [hours, minutes] = data.time.split(":").map(Number);
  const timezoneOffset = getTimezoneOffsetFromCountryCode(config.whatsappCountryCode || "+591");

  // Convert local business time to UTC
  // For Bolivia (UTC-4): 15:00 local = 15:00 - (-4) = 19:00 UTC
  const utcHours = hours - timezoneOffset;

  const dateOnly = data.date.toISOString().split("T")[0];
  const startTime = new Date(`${dateOnly}T00:00:00Z`);
  startTime.setUTCHours(utcHours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setUTCMinutes(endTime.getUTCMinutes() + data.duration);

  return {
    title,
    description,
    location: config.businessAddress || "Baby Spa",
    startTime,
    endTime,
  };
}

/**
 * Send appointment confirmation email using template from DB
 */
export async function sendAppointmentConfirmation(
  data: AppointmentEmailData
): Promise<SendEmailResult> {
  try {
    const config = await getEmailConfig();

    // Determine template key
    const templateKey = data.babyName
      ? "APPOINTMENT_CONFIRMATION"
      : "APPOINTMENT_CONFIRMATION_PARENT";

    // Fetch template from database
    const template = await prisma.messageTemplate.findUnique({
      where: { key: templateKey },
    });

    if (!template || !template.emailEnabled) {
      console.warn(`[EmailService] Template ${templateKey} not found or disabled, using fallback`);
      // Fallback to hardcoded if template not found
      return sendAppointmentConfirmationFallback(data, config);
    }

    // Format date for display
    const locale = "es-ES";
    const formattedDate = formatDateForDisplay(data.date, locale);

    // Process variables in template
    const variables: Record<string, string> = {
      parentName: data.parentName,
      babyName: data.babyName || "",
      date: formattedDate,
      time: data.time,
      serviceName: data.serviceName,
      address: config.businessAddress || "",
      portalUrl: config.portalUrl || "",
    };

    let processedBody = template.body;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      processedBody = processedBody.replace(regex, value);
    }

    // Create calendar event
    const calendarEvent = createCalendarEvent(data, config);

    // Convert body to HTML and add calendar buttons
    const html = await generateEmailWithCalendar(
      data.parentName,
      processedBody,
      calendarEvent,
      config
    );

    // Send email
    return sendEmail({
      to: data.parentEmail,
      subject: template.subject || "✅ Cita confirmada - Baby Spa",
      html,
      templateKey,
      category: TemplateCategory.APPOINTMENT,
      parentId: data.parentId,
    });
  } catch (error) {
    console.error("[EmailService] Error sending appointment confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fallback for appointment confirmation when template not found
 */
async function sendAppointmentConfirmationFallback(
  data: AppointmentEmailData,
  config: Awaited<ReturnType<typeof getEmailConfig>>
): Promise<SendEmailResult> {
  const locale = "es-ES";
  const formattedDate = formatDateForDisplay(data.date, locale);
  const calendarEvent = createCalendarEvent(data, config);

  const html = generateAppointmentConfirmationEmail(
    {
      parentName: data.parentName,
      babyName: data.babyName,
      date: formattedDate,
      time: data.time,
      serviceName: data.serviceName,
      address: config.businessAddress,
    },
    config,
    calendarEvent
  );

  const templateKey = data.babyName
    ? "APPOINTMENT_CONFIRMATION"
    : "APPOINTMENT_CONFIRMATION_PARENT";

  return sendEmail({
    to: data.parentEmail,
    subject: "✅ Cita confirmada - Baby Spa",
    html,
    templateKey,
    category: TemplateCategory.APPOINTMENT,
    parentId: data.parentId,
  });
}

/**
 * Send appointment rescheduled email using template from DB
 */
export async function sendAppointmentRescheduled(
  data: RescheduleEmailData
): Promise<SendEmailResult> {
  try {
    const config = await getEmailConfig();

    // Determine template key
    const templateKey = data.babyName
      ? "APPOINTMENT_RESCHEDULED"
      : "APPOINTMENT_RESCHEDULED_PARENT";

    // Fetch template from database
    const template = await prisma.messageTemplate.findUnique({
      where: { key: templateKey },
    });

    if (!template || !template.emailEnabled) {
      console.warn(`[EmailService] Template ${templateKey} not found or disabled, using fallback`);
      return sendAppointmentRescheduledFallback(data, config);
    }

    // Format dates for display
    const locale = "es-ES";
    const formattedOldDate = formatDateForDisplay(data.oldDate, locale);
    const formattedNewDate = formatDateForDisplay(data.date, locale);

    // Process variables in template
    const variables: Record<string, string> = {
      parentName: data.parentName,
      babyName: data.babyName || "",
      oldDate: formattedOldDate,
      oldTime: data.oldTime,
      newDate: formattedNewDate,
      newTime: data.time,
      date: formattedNewDate,
      time: data.time,
      serviceName: data.serviceName,
      address: config.businessAddress || "",
      portalUrl: config.portalUrl || "",
    };

    let processedBody = template.body;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      processedBody = processedBody.replace(regex, value);
    }

    // Create calendar event for NEW appointment
    const calendarEvent = createCalendarEvent(data, config);

    // Convert body to HTML and add calendar buttons
    const html = await generateEmailWithCalendar(
      data.parentName,
      processedBody,
      calendarEvent,
      config
    );

    // Send email
    return sendEmail({
      to: data.parentEmail,
      subject: template.subject || "📅 Cita reagendada - Baby Spa",
      html,
      templateKey,
      category: TemplateCategory.APPOINTMENT,
      parentId: data.parentId,
    });
  } catch (error) {
    console.error("[EmailService] Error sending appointment rescheduled:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fallback for appointment rescheduled when template not found
 */
async function sendAppointmentRescheduledFallback(
  data: RescheduleEmailData,
  config: Awaited<ReturnType<typeof getEmailConfig>>
): Promise<SendEmailResult> {
  const locale = "es-ES";
  const formattedOldDate = formatDateForDisplay(data.oldDate, locale);
  const formattedNewDate = formatDateForDisplay(data.date, locale);
  const calendarEvent = createCalendarEvent(data, config);

  const html = generateAppointmentRescheduledEmail(
    {
      parentName: data.parentName,
      babyName: data.babyName,
      date: formattedNewDate,
      time: data.time,
      serviceName: data.serviceName,
      address: config.businessAddress,
      oldDate: formattedOldDate,
      oldTime: data.oldTime,
    },
    config,
    calendarEvent
  );

  const templateKey = data.babyName
    ? "APPOINTMENT_RESCHEDULED"
    : "APPOINTMENT_RESCHEDULED_PARENT";

  return sendEmail({
    to: data.parentEmail,
    subject: "📅 Cita reagendada - Baby Spa",
    html,
    templateKey,
    category: TemplateCategory.APPOINTMENT,
    parentId: data.parentId,
  });
}

/**
 * Convert URLs and markdown links to clickable links
 * Supports:
 * - [Link Text](https://example.com) → <a href="...">Link Text</a>
 * - https://example.com → <a href="...">https://example.com</a>
 */
function linkify(text: string): string {
  // First, handle markdown-style links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let result = text.replace(markdownLinkRegex, '<a href="$2" target="_blank" style="color: #0d9488; text-decoration: underline; font-weight: 500;">$1</a>');

  // Then, handle plain URLs that are not already in href attributes
  // Negative lookbehind to avoid matching URLs already in href=""
  const plainUrlRegex = /(?<!href=")(https?:\/\/[^\s<"]+)/g;
  result = result.replace(plainUrlRegex, '<a href="$1" target="_blank" style="color: #0d9488; text-decoration: underline;">$1</a>');

  return result;
}

/**
 * Generate email HTML from template body with calendar buttons
 */
async function generateEmailWithCalendar(
  parentName: string,
  body: string,
  calendarEvent: ReturnType<typeof createCalendarEvent>,
  config: Awaited<ReturnType<typeof getEmailConfig>>
): Promise<string> {
  const {
    wrapEmailContent,
    generateGoogleCalendarLink,
    generateOutlookCalendarLink,
  } = await import("@/lib/utils/email-template");

  // Convert plain text body to HTML
  const bodyHtml = body
    .split("\n\n")
    .map((paragraph) => {
      // Check if it's a list item
      if (paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-")) {
        const items = paragraph.split("\n").map((item) => {
          const text = item.replace(/^[•\-]\s*/, "").trim();
          return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
        }).filter(Boolean).join("");
        return `<ul style="margin: 8px 0; padding-left: 20px; color: #374151;">${items}</ul>`;
      }

      // Check if it starts with recommendation emoji (📋) - Amber/Yellow
      if (paragraph.trim().startsWith("📋") || paragraph.trim().startsWith("⚠️")) {
        const lines = paragraph.split("\n");
        const header = lines[0];
        const rest = lines.slice(1).join("\n");

        if (rest.trim().startsWith("•") || rest.trim().startsWith("-")) {
          const items = rest.split("\n").map((item) => {
            const text = item.replace(/^[•\-]\s*/, "").trim();
            return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
          }).filter(Boolean).join("");
          return `
            <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">${header}</p>
              <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">${items}</ul>
            </div>
          `;
        }
        return `
          <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>
          </div>
        `;
      }

      // Check if it starts with ❌ (cancelled/before) - Red
      if (paragraph.trim().startsWith("❌")) {
        const lines = paragraph.split("\n").map((line) =>
          `<p style="margin: 4px 0; font-size: 16px; color: #991b1b;">${linkify(line)}</p>`
        ).join("");
        return `<div style="background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">${lines}</div>`;
      }

      // Check if it starts with ✅ (confirmed/after) - Green
      if (paragraph.trim().startsWith("✅")) {
        const lines = paragraph.split("\n").map((line) =>
          `<p style="margin: 4px 0; font-size: 16px; color: #166534;">${linkify(line)}</p>`
        ).join("");
        return `<div style="background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">${lines}</div>`;
      }

      // Check if it's appointment details (👶📅🕐💆📍) - Teal
      if (/^[👶📅🕐💆📍🎂🎉💙]/.test(paragraph.trim())) {
        const lines = paragraph.split("\n").map((line) =>
          `<p style="margin: 4px 0; font-size: 16px; color: #134e4a;">${linkify(line)}</p>`
        ).join("");
        return `<div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2f1 100%); border-radius: 12px; border-left: 4px solid #0d9488; padding: 16px; margin: 16px 0;">${lines}</div>`;
      }

      // Regular paragraph - linkify URLs
      return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>`;
    })
    .join("");

  // Generate calendar buttons HTML
  const googleLink = generateGoogleCalendarLink(calendarEvent);
  const outlookLink = generateOutlookCalendarLink(calendarEvent);

  const calendarButtonsHtml = `
    <div style="margin: 24px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">Agregar al calendario:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
        <tr>
          <td style="padding: 0 8px;">
            <a href="${googleLink}" target="_blank" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
              📅 Google Calendar
            </a>
          </td>
          <td style="padding: 0 8px;">
            <a href="${outlookLink}" target="_blank" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
              📅 Outlook
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Combine everything
  const content = `
    <h2 style="color: #134e4a; font-size: 22px; margin: 0 0 20px 0;">¡Hola ${parentName}!</h2>
    ${bodyHtml}
    ${calendarButtonsHtml}
  `;

  return wrapEmailContent(content, config);
}

// ============================================================
// STYLED EMAIL FUNCTION (for all emails)
// ============================================================

interface StyledEmailParams {
  to: string;
  subject: string;
  title: string;
  body: string; // Plain text with {variables} already replaced
  templateKey: string;
  category: TemplateCategory;
  parentId?: string;
}

/**
 * Send a styled email with the beautiful HTML template
 * This wraps any content in the brand design (header, footer, colors)
 */
export async function sendStyledEmail(params: StyledEmailParams): Promise<SendEmailResult> {
  try {
    const config = await getEmailConfig();

    // Convert plain text body to HTML paragraphs
    const bodyHtml = params.body
      .split("\n\n")
      .map(paragraph => {
        // Check if it's a list item
        if (paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-")) {
          const items = paragraph.split("\n").map(item => {
            const text = item.replace(/^[•\-]\s*/, "").trim();
            return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
          }).filter(Boolean).join("");
          return `<ul style="margin: 8px 0; padding-left: 20px; color: #374151;">${items}</ul>`;
        }

        // Check if it starts with recommendation emoji (📋 or ⚠️) - Amber/Yellow
        if (paragraph.trim().startsWith("📋") || paragraph.trim().startsWith("⚠️")) {
          const lines = paragraph.split("\n");
          const header = lines[0];
          const rest = lines.slice(1).join("\n");

          if (rest.trim().startsWith("•") || rest.trim().startsWith("-")) {
            const items = rest.split("\n").map(item => {
              const text = item.replace(/^[•\-]\s*/, "").trim();
              return text ? `<li style="margin-bottom: 4px;">${linkify(text)}</li>` : "";
            }).filter(Boolean).join("");
            return `
              <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">${header}</p>
                <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">${items}</ul>
              </div>
            `;
          }
          return `
            <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>
            </div>
          `;
        }

        // Check if it starts with ❌ (cancelled/before) - Red
        if (paragraph.trim().startsWith("❌")) {
          const lines = paragraph.split("\n").map(line =>
            `<p style="margin: 4px 0; font-size: 16px; color: #991b1b;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Check if it starts with ✅ (confirmed/after) - Green
        if (paragraph.trim().startsWith("✅")) {
          const lines = paragraph.split("\n").map(line =>
            `<p style="margin: 4px 0; font-size: 16px; color: #166534;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Check if it's appointment details (👶📅🕐💆📍🎂🎉💙) - Teal
        if (/^[👶📅🕐💆📍🎂🎉💙]/.test(paragraph.trim())) {
          const lines = paragraph.split("\n").map(line =>
            `<p style="margin: 4px 0; font-size: 16px; color: #134e4a;">${linkify(line)}</p>`
          ).join("");
          return `<div style="background: linear-gradient(135deg, #f0fdfa 0%, #e0f2f1 100%); border-radius: 12px; border-left: 4px solid #0d9488; padding: 16px; margin: 16px 0;">${lines}</div>`;
        }

        // Regular paragraph - linkify URLs
        return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${linkify(paragraph.replace(/\n/g, "<br>"))}</p>`;
      })
      .join("");

    // Generate the full HTML with template
    const { wrapEmailContent } = await import("@/lib/utils/email-template");

    const content = `
      <h2 style="color: #134e4a; font-size: 22px; margin: 0 0 20px 0;">${params.title}</h2>
      ${bodyHtml}
    `;

    const html = wrapEmailContent(content, config);

    // Send email
    return sendEmail({
      to: params.to,
      subject: params.subject,
      html,
      templateKey: params.templateKey,
      category: params.category,
      parentId: params.parentId,
    });
  } catch (error) {
    console.error("[EmailService] Error sending styled email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const emailService = {
  sendEmail,
  sendStyledEmail,
  processTemplate,
  updateEmailStatus,
  getEmailStats,
  getProblematicEmails,
  hasEmailProblems,
  resetEmailBounceCount,
  retryEmail,
  sendAppointmentConfirmation,
  sendAppointmentRescheduled,
};
