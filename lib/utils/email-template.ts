/**
 * Email Template Utils - Beautiful HTML Email Templates
 * Baby Spa - Fase 11
 *
 * Generates beautiful, responsive HTML emails with:
 * - Brand colors (teal/cyan gradient)
 * - Logo header
 * - Contact footer with social links
 * - Calendar integration buttons
 * - Multi-language support (ES/PT-BR)
 */

// =============================================================================
// Localized strings
// =============================================================================
const STRINGS = {
  es: {
    allRightsReserved: "Todos los derechos reservados",
  },
  "pt-BR": {
    allRightsReserved: "Todos os direitos reservados",
  },
};

/**
 * Get current locale from environment
 */
function getLocale(): "es" | "pt-BR" {
  const locale = process.env.NEXT_PUBLIC_LOCALE || "es";
  return locale === "pt-BR" ? "pt-BR" : "es";
}

/**
 * Get localized string
 */
function t(key: keyof typeof STRINGS["es"]): string {
  const locale = getLocale();
  return STRINGS[locale][key];
}

// Brand colors
const COLORS = {
  primary: "#0d9488", // teal-600
  primaryLight: "#14b8a6", // teal-500
  secondary: "#06b6d4", // cyan-500
  background: "#f0fdfa", // teal-50
  text: "#134e4a", // teal-900
  textLight: "#5eead4", // teal-300
  white: "#ffffff",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
};

interface EmailTemplateConfig {
  logoUrl?: string;
  businessName?: string;
  businessAddress?: string;
  whatsappNumber?: string;
  whatsappCountryCode?: string;
  instagramHandle?: string;
  portalUrl?: string;
}

interface AppointmentDetails {
  parentName: string;
  babyName?: string;
  date: string;
  time: string;
  serviceName: string;
  address?: string;
}

interface CalendarEventDetails {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Generate Google Calendar link
 */
export function generateGoogleCalendarLink(event: CalendarEventDetails): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar link
 */
export function generateOutlookCalendarLink(event: CalendarEventDetails): string {
  const formatDate = (date: Date) => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate .ics file content for Apple Calendar
 */
export function generateICSContent(event: CalendarEventDetails): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const escapeText = (text: string) => {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Baby Spa//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description)}
LOCATION:${escapeText(event.location)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate data URL for .ics download
 */
export function generateICSDataUrl(event: CalendarEventDetails): string {
  const icsContent = generateICSContent(event);
  const base64 = Buffer.from(icsContent).toString("base64");
  return `data:text/calendar;base64,${base64}`;
}

/**
 * Generate calendar buttons HTML
 */
function generateCalendarButtons(event: CalendarEventDetails): string {
  const googleLink = generateGoogleCalendarLink(event);
  const outlookLink = generateOutlookCalendarLink(event);
  // Note: ICS download requires server-side endpoint for proper file download
  // For now, we'll just show Google and Outlook buttons

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="padding: 0 8px;">
          <a href="${googleLink}" target="_blank" style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); color: ${COLORS.white}; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            📅 Google Calendar
          </a>
        </td>
        <td style="padding: 0 8px;">
          <a href="${outlookLink}" target="_blank" style="display: inline-block; padding: 12px 20px; background: ${COLORS.grayLight}; color: ${COLORS.text}; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #e5e7eb;">
            📧 Outlook
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate the email header with logo
 */
function generateHeader(config: EmailTemplateConfig): string {
  const logoUrl = config.logoUrl || "https://babyspa.online/images/logoBabySpa.png";
  const businessName = config.businessName || "Baby Spa";

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);">
      <tr>
        <td style="padding: 32px 24px; text-align: center;">
          <img src="${logoUrl}" alt="${businessName}" width="120" style="max-width: 120px; height: auto; display: block; margin: 0 auto;" />
          <h1 style="color: ${COLORS.white}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; font-weight: 700; margin: 16px 0 0 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${businessName}
          </h1>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate the email footer with contact info and social icons
 */
function generateFooter(config: EmailTemplateConfig): string {
  const whatsappLink = config.whatsappNumber
    ? `https://wa.me/${(config.whatsappCountryCode || "+591").replace("+", "")}${config.whatsappNumber}`
    : null;
  const instagramLink = config.instagramHandle
    ? `https://instagram.com/${config.instagramHandle}`
    : null;

  // Social icons using CDN (with emoji fallback for email clients that block images)
  const socialIconsHtml: string[] = [];

  if (whatsappLink) {
    socialIconsHtml.push(`
      <td style="padding: 0 6px;">
        <a href="${whatsappLink}" target="_blank" style="text-decoration: none;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background: #25D366; border-radius: 50%; padding: 8px; width: 32px; height: 32px; text-align: center;">
                <img src="https://cdn.simpleicons.org/whatsapp/ffffff" alt="WhatsApp" width="16" height="16" style="display: block; margin: 0 auto;" />
              </td>
            </tr>
          </table>
        </a>
      </td>
    `);
  }

  if (instagramLink) {
    socialIconsHtml.push(`
      <td style="padding: 0 6px;">
        <a href="${instagramLink}" target="_blank" style="text-decoration: none;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 50%; padding: 8px; width: 32px; height: 32px; text-align: center;">
                <img src="https://cdn.simpleicons.org/instagram/ffffff" alt="Instagram" width="16" height="16" style="display: block; margin: 0 auto;" />
              </td>
            </tr>
          </table>
        </a>
      </td>
    `);
  }

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${COLORS.grayLight}; border-top: 3px solid ${COLORS.primary};">
      <tr>
        <td style="padding: 24px; text-align: center;">
          ${config.businessAddress ? `
            <p style="color: ${COLORS.gray}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; margin: 0 0 16px 0;">
              📍 ${config.businessAddress}
            </p>
          ` : ""}
          ${socialIconsHtml.length > 0 ? `
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 16px auto;">
              <tr>
                ${socialIconsHtml.join("")}
              </tr>
            </table>
            <p style="color: ${COLORS.gray}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; margin: 0 0 16px 0;">
              ${whatsappLink ? `<a href="${whatsappLink}" style="color: ${COLORS.primary}; text-decoration: none;">WhatsApp</a>` : ""}
              ${whatsappLink && instagramLink ? " • " : ""}
              ${instagramLink ? `<a href="${instagramLink}" style="color: ${COLORS.primary}; text-decoration: none;">@${config.instagramHandle}</a>` : ""}
            </p>
          ` : ""}
          <p style="color: ${COLORS.gray}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Baby Spa. ${t("allRightsReserved")}.
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Wrap content in the base email template
 */
export function wrapEmailContent(content: string, config: EmailTemplateConfig): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Baby Spa</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.background};">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td>
              ${generateHeader(config)}
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td>
              ${generateFooter(config)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate appointment details card HTML
 */
function generateAppointmentCard(details: AppointmentDetails): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, ${COLORS.background} 0%, #e0f2f1 100%); border-radius: 12px; border-left: 4px solid ${COLORS.primary};">
      <tr>
        <td style="padding: 20px;">
          ${details.babyName ? `
            <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.text};">
              <strong>👶 Bebé:</strong> ${details.babyName}
            </p>
          ` : ""}
          <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.text};">
            <strong>📅 Fecha:</strong> ${details.date}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.text};">
            <strong>🕐 Hora:</strong> ${details.time}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.text};">
            <strong>💆 Servicio:</strong> ${details.serviceName}
          </p>
          ${details.address ? `
            <p style="margin: 0; font-size: 16px; color: ${COLORS.text};">
              <strong>📍 Dirección:</strong> ${details.address}
            </p>
          ` : ""}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generate appointment confirmation email HTML
 */
export function generateAppointmentConfirmationEmail(
  details: AppointmentDetails,
  config: EmailTemplateConfig,
  calendarEvent?: CalendarEventDetails
): string {
  const greeting = `<h2 style="color: ${COLORS.text}; font-size: 22px; margin: 0 0 16px 0;">¡Hola ${details.parentName}!</h2>`;

  const message = `
    <p style="color: ${COLORS.gray}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Tu cita ha sido <span style="color: ${COLORS.primary}; font-weight: 600;">agendada exitosamente</span>:
    </p>
  `;

  const appointmentCard = generateAppointmentCard(details);

  const calendarButtons = calendarEvent ? generateCalendarButtons(calendarEvent) : "";

  const recommendations = `
    <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">📋 Recomendaciones:</p>
      <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 4px;">Llegar 10 minutos antes</li>
        <li style="margin-bottom: 4px;">Traer pañal acuático</li>
        <li>El bebé no debe haber recibido vacunas en las últimas 72 horas</li>
      </ul>
    </div>
  `;

  const portalLink = config.portalUrl ? `
    <p style="color: ${COLORS.gray}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
      ¿Necesitas cambiar tu cita?<br>
      <a href="${config.portalUrl}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">Ingresa al portal de padres →</a>
    </p>
  ` : "";

  const closing = `
    <p style="color: ${COLORS.text}; font-size: 16px; margin: 24px 0 0 0; text-align: center;">
      ¡Te esperamos! 💙
    </p>
  `;

  const content = greeting + message + appointmentCard + calendarButtons + recommendations + portalLink + closing;

  return wrapEmailContent(content, config);
}

/**
 * Generate appointment rescheduled email HTML
 */
export function generateAppointmentRescheduledEmail(
  details: AppointmentDetails & { oldDate: string; oldTime: string },
  config: EmailTemplateConfig,
  calendarEvent?: CalendarEventDetails
): string {
  const greeting = `<h2 style="color: ${COLORS.text}; font-size: 22px; margin: 0 0 16px 0;">¡Hola ${details.parentName}!</h2>`;

  const message = `
    <p style="color: ${COLORS.gray}; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Tu cita ha sido <span style="color: ${COLORS.primary}; font-weight: 600;">reagendada</span>:
    </p>
  `;

  const oldAppointment = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef2f2; border-radius: 8px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            ❌ <strong>Antes:</strong> ${details.oldDate} a las ${details.oldTime}
          </p>
        </td>
      </tr>
    </table>
  `;

  const newAppointment = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f0fdf4; border-radius: 8px; margin-bottom: 16px;">
      <tr>
        <td style="padding: 12px 16px;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            ✅ <strong>Ahora:</strong> ${details.date} a las ${details.time}
          </p>
        </td>
      </tr>
    </table>
  `;

  const appointmentCard = generateAppointmentCard(details);

  const calendarButtons = calendarEvent ? generateCalendarButtons(calendarEvent) : "";

  const portalLink = config.portalUrl ? `
    <p style="color: ${COLORS.gray}; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
      ¿Necesitas hacer otro cambio?<br>
      <a href="${config.portalUrl}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: 600;">Ingresa al portal de padres →</a>
    </p>
  ` : "";

  const closing = `
    <p style="color: ${COLORS.text}; font-size: 16px; margin: 24px 0 0 0; text-align: center;">
      ¡Te esperamos! 💙
    </p>
  `;

  const content = greeting + message + oldAppointment + newAppointment + appointmentCard + calendarButtons + portalLink + closing;

  return wrapEmailContent(content, config);
}

/**
 * Generate a generic styled email with custom content
 */
export function generateStyledEmail(
  title: string,
  bodyContent: string,
  config: EmailTemplateConfig
): string {
  const content = `
    <h2 style="color: ${COLORS.text}; font-size: 22px; margin: 0 0 16px 0;">${title}</h2>
    <div style="color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${bodyContent}
    </div>
  `;

  return wrapEmailContent(content, config);
}

export const emailTemplateUtils = {
  generateGoogleCalendarLink,
  generateOutlookCalendarLink,
  generateICSContent,
  generateICSDataUrl,
  wrapEmailContent,
  generateAppointmentConfirmationEmail,
  generateAppointmentRescheduledEmail,
  generateStyledEmail,
};
