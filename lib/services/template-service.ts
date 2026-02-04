/**
 * Template Service - Message Templates Management
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Multi-language support: ES (Bolivia) and PT-BR (Brasil)
 */

import { prisma } from "@/lib/db";
import { TemplateCategory, Prisma } from "@prisma/client";
import { emailService } from "./email-service";

/**
 * Get current locale from environment
 */
export function getLocale(): "es" | "pt-BR" {
  const locale = process.env.NEXT_PUBLIC_LOCALE || "es";
  return locale === "pt-BR" ? "pt-BR" : "es";
}

// =============================================================================
// SPANISH TEMPLATES (Bolivia)
// =============================================================================
export const DEFAULT_TEMPLATES_ES = [
  // Appointment Reminders
  {
    key: "APPOINTMENT_REMINDER_24H",
    name: "Recordatorio de cita 24h",
    description: "Email enviado 24 horas antes de la cita",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "⏰ Recordatorio: Cita mañana en Baby Spa",
    body: `Te recordamos que tienes una cita programada para mañana:

👶 Bebé: {babyName}
📅 Fecha: {date}
🕐 Hora: {time}
💆 Servicio: {serviceName}
📍 Dirección: {address}

📋 Recomendaciones:
• Llegar 10 minutos antes
• Traer pañal acuático
• El bebé no debe haber recibido vacunas en las últimas 72 horas

¿Necesitas cambiar tu cita? [Ingresa al portal de padres]({portalUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "babyName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_DAY_WHATSAPP",
    name: "Recordatorio día de cita (WhatsApp)",
    description: "Mensaje WhatsApp el mismo día de la cita",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `¡Hola {parentName}!

Te recordamos que hoy tienes cita en Baby Spa:

{babyName}
{time}
{serviceName}

¡Te esperamos!`,
    variables: ["parentName", "babyName", "time", "serviceName"],
  },
  {
    key: "APPOINTMENT_MULTIPLE",
    name: "Múltiples citas del día",
    description: "Cuando hay varias citas el mismo día",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `¡Hola {parentName}!

Te recordamos que hoy tienes {count} citas en Baby Spa:

{appointmentsList}

¡Te esperamos!`,
    variables: ["parentName", "count", "appointmentsList"],
  },
  {
    key: "PAYMENT_REMINDER_48H",
    name: "Recordatorio de pago 48h",
    description: "WhatsApp cuando hay pago pendiente 48h antes",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `Hola {parentName},

Tu cita para {babyName} el {date} a las {time} requiere pago anticipado de {amount} para confirmar.

Puedes pagar en nuestras instalaciones o por transferencia.

Baby Spa`,
    variables: ["parentName", "babyName", "date", "time", "amount"],
  },

  // Mesversary
  {
    key: "MESVERSARY_BEFORE",
    name: "Mesversario (3 días antes)",
    description: "Mensaje 3 días antes del mesversario",
    category: TemplateCategory.MESVERSARY,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "🎂 ¡{babyName} cumple {months} meses pronto!",
    body: `🎉 ¡{babyName} cumple {months} meses el {date}!

¿Ya tienes planes para celebrar este hermoso hito?

✨ En Baby Spa tenemos sesiones especiales de Cumple Mes:
• 📸 Sesión de fotos temática
• 🛁 Hidroterapia con decoración especial
• 🎁 Sorpresa para el bebé

[Reserva tu sesión aquí]({bookingUrl})

¡Celebremos juntos! 💙`,
    bodyVersion2: `✨ ¡Casi {months} meses, {babyName}!

📅 El {date} es un día muy especial - {babyName} cumple {months} meses de vida.

🎈 ¿Qué tal una sesión de Cumple Mes en Baby Spa?
• Fotos hermosas
• Momento único en familia
• Recuerdos para siempre

[Reserva tu sesión]({bookingUrl})

Un abrazo 💕`,
    bodyVersion3: `🌟 ¡Se acerca un hito importante!

👶 {babyName} está por cumplir {months} meses el {date}.

¡Merece una celebración especial! En Baby Spa preparamos todo para que sea un día inolvidable.

[Agenda tu sesión de Cumple Mes]({bookingUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "babyName", "months", "date", "bookingUrl"],
    config: { maxAgeMonths: 12, daysBefore: 3 },
  },
  {
    key: "MESVERSARY_DAY",
    name: "Mesversario (día)",
    description: "Mensaje el día del mesversario",
    category: TemplateCategory.MESVERSARY,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "🎂 ¡Feliz {months} meses, {babyName}!",
    body: `🎉 ¡Hoy {babyName} cumple {months} meses!

¡Felicidades por este hermoso hito! Cada mes es un logro increíble lleno de nuevos descubrimientos.

🎈 Si aún no has agendado una sesión de Cumple Mes, todavía estás a tiempo para celebrar:

[Reserva tu sesión de Cumple Mes]({bookingUrl})

Con mucho cariño 💙`,
    variables: ["parentName", "babyName", "months", "bookingUrl"],
  },

  // Re-engagement
  {
    key: "REENGAGEMENT_45_DAYS",
    name: "Cliente inactivo 45 días",
    description: "Email para clientes que no han venido en 45 días",
    category: TemplateCategory.REENGAGEMENT,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "💙 {parentName}, te extrañamos en Baby Spa",
    body: `¡Te extrañamos! Ha pasado un tiempo desde que vimos a {babyName}.

📅 Última visita: {lastVisitDate}
👶 Edad actual: {currentAge}

La estimulación acuática sigue siendo muy beneficiosa en esta etapa. Los beneficios incluyen:
• Fortalecimiento muscular
• Mejor coordinación motriz
• Estimulación sensorial
• Momentos de conexión en familia

✨ Nos encantaría verlos de nuevo y seguir acompañando el desarrollo de {babyName}.

[Reserva tu próxima sesión]({bookingUrl})

Un abrazo 💕`,
    variables: ["parentName", "babyName", "lastVisitDate", "currentAge", "bookingUrl"],
    config: { inactiveDays: 45, maxFrequencyDays: 60 },
  },

  // Lead Management
  {
    key: "LEAD_WELCOME",
    name: "Bienvenida a Lead",
    description: "Email de bienvenida después de evento",
    category: TemplateCategory.LEAD,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "🤰 ¡Bienvenida a la familia Baby Spa!",
    body: `🎉 ¡Felicidades por tu embarazo!

Gracias por asistir a "{eventName}". Fue un placer conocerte.

✨ En Baby Spa nos especializamos en el bienestar de tu bebé desde los primeros días:
• 🛁 Hidroterapia para bebés de 0-36 meses
• 🏊 Estimulación temprana acuática
• 🎂 Sesiones especiales de Cumple Mes
• 📸 Momentos únicos para recordar

Cuando tu bebé nazca, estaremos encantados de recibirlos y comenzar juntos este hermoso camino.

📲 WhatsApp: {whatsappNumber}

Con mucho cariño 💕`,
    variables: ["parentName", "eventName", "whatsappNumber"],
  },

  // Admin
  {
    key: "DAILY_SUMMARY",
    name: "Resumen diario",
    description: "Resumen diario para owners",
    category: TemplateCategory.ADMIN,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📊 Resumen del día - Baby Spa {date}",
    body: `📅 Citas de hoy ({appointmentCount}):
{appointmentsList}

📲 Mensajes WhatsApp pendientes: {pendingMessagesCount}

📧 Emails enviados ayer: {emailsSentYesterday}

🎂 Mesversarios esta semana:
{mesversaryList}

⚠️ Atención requerida:
{attentionList}`,
    variables: [
      "date",
      "appointmentCount",
      "appointmentsList",
      "pendingMessagesCount",
      "emailsSentYesterday",
      "mesversaryList",
      "attentionList",
    ],
  },

  // Appointment Confirmations (immediate emails, not cron)
  {
    key: "APPOINTMENT_CONFIRMATION",
    name: "Confirmación de cita",
    description: "Email enviado inmediatamente al agendar una cita",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "✅ Cita confirmada - Baby Spa",
    body: `Tu cita ha sido agendada exitosamente:

👶 Bebé: {babyName}
📅 Fecha: {date}
🕐 Hora: {time}
💆 Servicio: {serviceName}
📍 Dirección: {address}

📋 Recomendaciones:
• Llegar 10 minutos antes
• Traer pañal acuático
• El bebé no debe haber recibido vacunas en las últimas 72 horas

¿Necesitas cambiar tu cita? [Ingresa al portal de padres]({portalUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "babyName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_CONFIRMATION_PARENT",
    name: "Confirmación de cita (para padres)",
    description: "Email de confirmación para servicios de padres (sin bebé)",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "✅ Cita confirmada - Baby Spa",
    body: `Tu cita ha sido agendada exitosamente:

📅 Fecha: {date}
🕐 Hora: {time}
💆 Servicio: {serviceName}
📍 Dirección: {address}

¿Necesitas cambiar tu cita? [Ingresa al portal de padres]({portalUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_RESCHEDULED",
    name: "Cita reagendada",
    description: "Email enviado cuando se reagenda una cita",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📅 Cita reagendada - Baby Spa",
    body: `Tu cita ha sido reagendada:

❌ Antes: {oldDate} a las {oldTime}

✅ Ahora: {newDate} a las {newTime}

👶 Bebé: {babyName}
💆 Servicio: {serviceName}
📍 Dirección: {address}

📋 Recomendaciones:
• Llegar 10 minutos antes
• Traer pañal acuático
• El bebé no debe haber recibido vacunas en las últimas 72 horas

¿Necesitas hacer otro cambio? [Ingresa al portal de padres]({portalUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "babyName", "oldDate", "oldTime", "newDate", "newTime", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_RESCHEDULED_PARENT",
    name: "Cita reagendada (para padres)",
    description: "Email de reagendamiento para servicios de padres (sin bebé)",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📅 Cita reagendada - Baby Spa",
    body: `Tu cita ha sido reagendada:

❌ Antes: {oldDate} a las {oldTime}

✅ Ahora: {newDate} a las {newTime}

💆 Servicio: {serviceName}
📍 Dirección: {address}

¿Necesitas hacer otro cambio? [Ingresa al portal de padres]({portalUrl})

¡Te esperamos! 💙`,
    variables: ["parentName", "oldDate", "oldTime", "newDate", "newTime", "serviceName", "address", "portalUrl"],
  },
];

// =============================================================================
// PORTUGUESE TEMPLATES (Brasil)
// =============================================================================
export const DEFAULT_TEMPLATES_PT = [
  // Appointment Reminders
  {
    key: "APPOINTMENT_REMINDER_24H",
    name: "Lembrete de consulta 24h",
    description: "Email enviado 24 horas antes da consulta",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "⏰ Lembrete: Consulta amanhã no Baby Spa",
    body: `Lembramos que você tem uma consulta agendada para amanhã:

👶 Bebê: {babyName}
📅 Data: {date}
🕐 Horário: {time}
💆 Serviço: {serviceName}
📍 Endereço: {address}

📋 Recomendações:
• Chegar 10 minutos antes
• Trazer fralda aquática
• O bebê não deve ter recebido vacinas nas últimas 72 horas

Precisa alterar sua consulta? [Acesse o portal de pais]({portalUrl})

Esperamos você! 💙`,
    variables: ["parentName", "babyName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_DAY_WHATSAPP",
    name: "Lembrete do dia (WhatsApp)",
    description: "Mensagem WhatsApp no mesmo dia da consulta",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `Olá {parentName}!

Lembramos que hoje você tem consulta no Baby Spa:

{babyName}
{time}
{serviceName}

Esperamos você!`,
    variables: ["parentName", "babyName", "time", "serviceName"],
  },
  {
    key: "APPOINTMENT_MULTIPLE",
    name: "Múltiplas consultas do dia",
    description: "Quando há várias consultas no mesmo dia",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `Olá {parentName}!

Lembramos que hoje você tem {count} consultas no Baby Spa:

{appointmentsList}

Esperamos você!`,
    variables: ["parentName", "count", "appointmentsList"],
  },
  {
    key: "PAYMENT_REMINDER_48H",
    name: "Lembrete de pagamento 48h",
    description: "WhatsApp quando há pagamento pendente 48h antes",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: false,
    whatsappEnabled: true,
    body: `Olá {parentName},

Sua consulta para {babyName} no dia {date} às {time} requer pagamento antecipado de {amount} para confirmar.

Você pode pagar em nossas instalações ou por transferência.

Baby Spa`,
    variables: ["parentName", "babyName", "date", "time", "amount"],
  },

  // Mesversary
  {
    key: "MESVERSARY_BEFORE",
    name: "Mesversário (3 dias antes)",
    description: "Mensagem 3 dias antes do mesversário",
    category: TemplateCategory.MESVERSARY,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "🎂 {babyName} completa {months} meses em breve!",
    body: `🎉 {babyName} completa {months} meses no dia {date}!

Já tem planos para celebrar esse lindo marco?

✨ No Baby Spa temos sessões especiais de Mêsversário:
• 📸 Sessão de fotos temática
• 🛁 Hidroterapia com decoração especial
• 🎁 Surpresa para o bebê

[Reserve sua sessão aqui]({bookingUrl})

Vamos celebrar juntos! 💙`,
    bodyVersion2: `✨ Quase {months} meses, {babyName}!

📅 O dia {date} é muito especial - {babyName} completa {months} meses de vida.

🎈 Que tal uma sessão de Mêsversário no Baby Spa?
• Fotos lindas
• Momento único em família
• Memórias para sempre

[Reserve sua sessão]({bookingUrl})

Um abraço 💕`,
    bodyVersion3: `🌟 Um marco importante se aproxima!

👶 {babyName} está prestes a completar {months} meses no dia {date}.

Merece uma celebração especial! No Baby Spa preparamos tudo para que seja um dia inesquecível.

[Agende sua sessão de Mêsversário]({bookingUrl})

Esperamos você! 💙`,
    variables: ["parentName", "babyName", "months", "date", "bookingUrl"],
    config: { maxAgeMonths: 12, daysBefore: 3 },
  },
  {
    key: "MESVERSARY_DAY",
    name: "Mesversário (dia)",
    description: "Mensagem no dia do mesversário",
    category: TemplateCategory.MESVERSARY,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "🎂 Feliz {months} meses, {babyName}!",
    body: `🎉 Hoje {babyName} completa {months} meses!

Parabéns por esse lindo marco! Cada mês é uma conquista incrível cheia de novas descobertas.

🎈 Se ainda não agendou uma sessão de Mêsversário, ainda dá tempo de celebrar:

[Reserve sua sessão de Mêsversário]({bookingUrl})

Com muito carinho 💙`,
    variables: ["parentName", "babyName", "months", "bookingUrl"],
  },

  // Re-engagement
  {
    key: "REENGAGEMENT_45_DAYS",
    name: "Cliente inativo 45 dias",
    description: "Email para clientes que não vieram em 45 dias",
    category: TemplateCategory.REENGAGEMENT,
    emailEnabled: true,
    whatsappEnabled: true,
    subject: "💙 {parentName}, sentimos sua falta no Baby Spa",
    body: `Sentimos sua falta! Já faz um tempo desde que vimos {babyName}.

📅 Última visita: {lastVisitDate}
👶 Idade atual: {currentAge}

A estimulação aquática continua sendo muito benéfica nesta fase. Os benefícios incluem:
• Fortalecimento muscular
• Melhor coordenação motora
• Estimulação sensorial
• Momentos de conexão em família

✨ Adoraríamos ver vocês novamente e continuar acompanhando o desenvolvimento de {babyName}.

[Reserve sua próxima sessão]({bookingUrl})

Um abraço 💕`,
    variables: ["parentName", "babyName", "lastVisitDate", "currentAge", "bookingUrl"],
    config: { inactiveDays: 45, maxFrequencyDays: 60 },
  },

  // Lead Management
  {
    key: "LEAD_WELCOME",
    name: "Boas-vindas ao Lead",
    description: "Email de boas-vindas após evento",
    category: TemplateCategory.LEAD,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "🤰 Bem-vinda à família Baby Spa!",
    body: `🎉 Parabéns pela sua gravidez!

Obrigada por participar de "{eventName}". Foi um prazer conhecer você.

✨ No Baby Spa somos especialistas no bem-estar do seu bebê desde os primeiros dias:
• 🛁 Hidroterapia para bebês de 0-36 meses
• 🏊 Estimulação precoce aquática
• 🎂 Sessões especiais de Mêsversário
• 📸 Momentos únicos para recordar

Quando seu bebê nascer, ficaremos felizes em recebê-los e começar juntos essa linda jornada.

📲 WhatsApp: {whatsappNumber}

Com muito carinho 💕`,
    variables: ["parentName", "eventName", "whatsappNumber"],
  },

  // Admin
  {
    key: "DAILY_SUMMARY",
    name: "Resumo diário",
    description: "Resumo diário para owners",
    category: TemplateCategory.ADMIN,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📊 Resumo do dia - Baby Spa {date}",
    body: `📅 Consultas de hoje ({appointmentCount}):
{appointmentsList}

📲 Mensagens WhatsApp pendentes: {pendingMessagesCount}

📧 Emails enviados ontem: {emailsSentYesterday}

🎂 Mêsversários esta semana:
{mesversaryList}

⚠️ Atenção necessária:
{attentionList}`,
    variables: [
      "date",
      "appointmentCount",
      "appointmentsList",
      "pendingMessagesCount",
      "emailsSentYesterday",
      "mesversaryList",
      "attentionList",
    ],
  },

  // Appointment Confirmations (immediate emails, not cron)
  {
    key: "APPOINTMENT_CONFIRMATION",
    name: "Confirmação de consulta",
    description: "Email enviado imediatamente ao agendar uma consulta",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "✅ Consulta confirmada - Baby Spa",
    body: `Sua consulta foi agendada com sucesso:

👶 Bebê: {babyName}
📅 Data: {date}
🕐 Horário: {time}
💆 Serviço: {serviceName}
📍 Endereço: {address}

📋 Recomendações:
• Chegar 10 minutos antes
• Trazer fralda aquática
• O bebê não deve ter recebido vacinas nas últimas 72 horas

Precisa alterar sua consulta? [Acesse o portal de pais]({portalUrl})

Esperamos você! 💙`,
    variables: ["parentName", "babyName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_CONFIRMATION_PARENT",
    name: "Confirmação de consulta (para pais)",
    description: "Email de confirmação para serviços de pais (sem bebê)",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "✅ Consulta confirmada - Baby Spa",
    body: `Sua consulta foi agendada com sucesso:

📅 Data: {date}
🕐 Horário: {time}
💆 Serviço: {serviceName}
📍 Endereço: {address}

Precisa alterar sua consulta? [Acesse o portal de pais]({portalUrl})

Esperamos você! 💙`,
    variables: ["parentName", "date", "time", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_RESCHEDULED",
    name: "Consulta reagendada",
    description: "Email enviado quando uma consulta é reagendada",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📅 Consulta reagendada - Baby Spa",
    body: `Sua consulta foi reagendada:

❌ Antes: {oldDate} às {oldTime}

✅ Agora: {newDate} às {newTime}

👶 Bebê: {babyName}
💆 Serviço: {serviceName}
📍 Endereço: {address}

📋 Recomendações:
• Chegar 10 minutos antes
• Trazer fralda aquática
• O bebê não deve ter recebido vacinas nas últimas 72 horas

Precisa fazer outra alteração? [Acesse o portal de pais]({portalUrl})

Esperamos você! 💙`,
    variables: ["parentName", "babyName", "oldDate", "oldTime", "newDate", "newTime", "serviceName", "address", "portalUrl"],
  },
  {
    key: "APPOINTMENT_RESCHEDULED_PARENT",
    name: "Consulta reagendada (para pais)",
    description: "Email de reagendamento para serviços de pais (sem bebê)",
    category: TemplateCategory.APPOINTMENT,
    emailEnabled: true,
    whatsappEnabled: false,
    subject: "📅 Consulta reagendada - Baby Spa",
    body: `Sua consulta foi reagendada:

❌ Antes: {oldDate} às {oldTime}

✅ Agora: {newDate} às {newTime}

💆 Serviço: {serviceName}
📍 Endereço: {address}

Precisa fazer outra alteração? [Acesse o portal de pais]({portalUrl})

Esperamos você! 💙`,
    variables: ["parentName", "oldDate", "oldTime", "newDate", "newTime", "serviceName", "address", "portalUrl"],
  },
];

// =============================================================================
// HELPER: Get templates for current locale
// =============================================================================
export function getDefaultTemplates() {
  const locale = getLocale();
  return locale === "pt-BR" ? DEFAULT_TEMPLATES_PT : DEFAULT_TEMPLATES_ES;
}

// Legacy export for backward compatibility
export const DEFAULT_TEMPLATES = DEFAULT_TEMPLATES_ES;

/**
 * Get a template by key
 */
export async function getTemplateByKey(key: string) {
  return prisma.messageTemplate.findUnique({
    where: { key },
  });
}

/**
 * Get all templates by category
 */
export async function getTemplatesByCategory(category: TemplateCategory) {
  return prisma.messageTemplate.findMany({
    where: { category },
    orderBy: { name: "asc" },
  });
}

/**
 * Get all active templates
 */
export async function getAllTemplates() {
  return prisma.messageTemplate.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

/**
 * Update a template
 */
export async function updateTemplate(
  key: string,
  data: Prisma.MessageTemplateUpdateInput
) {
  return prisma.messageTemplate.update({
    where: { key },
    data,
  });
}

/**
 * Process a template with variables
 */
export async function processTemplateWithVariables(
  templateKey: string,
  variables: Record<string, string>,
  version?: number
): Promise<{ subject?: string; body: string } | null> {
  const template = await getTemplateByKey(templateKey);

  if (!template || !template.isActive) {
    return null;
  }

  // Select the body version (for mesversarios)
  let body = template.body;
  if (version === 2 && template.bodyVersion2) {
    body = template.bodyVersion2;
  } else if (version === 3 && template.bodyVersion3) {
    body = template.bodyVersion3;
  }

  // Process variables
  const processedBody = emailService.processTemplate(body, variables);
  const processedSubject = template.subject
    ? emailService.processTemplate(template.subject, variables)
    : undefined;

  return {
    subject: processedSubject,
    body: processedBody,
  };
}

/**
 * Determine which mesversary version to use (rotation)
 * Mes 1 → V1, Mes 2 → V2, Mes 3 → V3, Mes 4 → V1...
 */
export function selectMesversaryVersion(months: number): number {
  return ((months - 1) % 3) + 1;
}

/**
 * Seed default templates if they don't exist
 * Uses templates based on current locale (NEXT_PUBLIC_LOCALE)
 */
export async function seedDefaultTemplates(): Promise<number> {
  const templates = getDefaultTemplates();
  let created = 0;

  for (const template of templates) {
    const existing = await prisma.messageTemplate.findUnique({
      where: { key: template.key },
    });

    if (!existing) {
      await prisma.messageTemplate.create({
        data: template as Prisma.MessageTemplateCreateInput,
      });
      created++;
    }
  }

  return created;
}

/**
 * Reseed all templates - updates existing templates with default content
 * Uses templates based on current locale (NEXT_PUBLIC_LOCALE)
 */
export async function reseedAllTemplates(): Promise<{ created: number; updated: number }> {
  const templates = getDefaultTemplates();
  let created = 0;
  let updated = 0;

  for (const template of templates) {
    const existing = await prisma.messageTemplate.findUnique({
      where: { key: template.key },
    });

    if (existing) {
      // Update existing template with new default content
      await prisma.messageTemplate.update({
        where: { key: template.key },
        data: {
          name: template.name,
          description: template.description,
          subject: template.subject || null,
          body: template.body,
          bodyVersion2: template.bodyVersion2 || null,
          bodyVersion3: template.bodyVersion3 || null,
          variables: template.variables,
          config: template.config || {},
          // Preserve user settings
          // emailEnabled, whatsappEnabled, isActive are NOT overwritten
        },
      });
      updated++;
    } else {
      await prisma.messageTemplate.create({
        data: template as Prisma.MessageTemplateCreateInput,
      });
      created++;
    }
  }

  return { created, updated };
}

/**
 * Check if templates are seeded
 */
export async function areTemplatesSeeded(): Promise<boolean> {
  const templates = getDefaultTemplates();
  const count = await prisma.messageTemplate.count();
  return count >= templates.length;
}

export const templateService = {
  getTemplateByKey,
  getTemplatesByCategory,
  getAllTemplates,
  updateTemplate,
  processTemplateWithVariables,
  selectMesversaryVersion,
  seedDefaultTemplates,
  reseedAllTemplates,
  areTemplatesSeeded,
  getLocale,
  getDefaultTemplates,
  DEFAULT_TEMPLATES,
  DEFAULT_TEMPLATES_ES,
  DEFAULT_TEMPLATES_PT,
};
