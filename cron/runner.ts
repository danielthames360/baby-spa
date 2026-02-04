/**
 * Cron Runner - Main Job Executor
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * Orchestrates all cron jobs for a specific country/database.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Import job modules (will be created next)
import { runAppointmentReminders } from "./jobs/daily/appointment-reminders";
import { runMesversaryMessages } from "./jobs/daily/mesversary-messages";
import { runReengagement } from "./jobs/daily/reengagement";
import { runLeadAlerts } from "./jobs/daily/lead-alerts";
import { runMaintenance } from "./jobs/daily/maintenance";
import { sendDailySummary } from "./jobs/daily/daily-summary";
import { runWeeklyCleanup } from "./jobs/weekly/cleanup";

type Country = "bolivia" | "brasil";

/**
 * Get Prisma client for a specific country
 */
function getPrismaClient(country: Country): PrismaClient {
  const connectionString =
    country === "brasil"
      ? process.env.DATABASE_URL_BRAZIL
      : process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(`Database URL not configured for ${country}`);
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Get country configuration
 */
function getCountryConfig(country: Country) {
  return {
    bolivia: {
      timezone: "America/La_Paz",
      utcOffset: -4,
      locale: "es-BO",
      currency: "BOB",
      whatsappNumber: "+591 XXX XXX XXX",
      portalUrl: "https://babyspa.online/portal",
      bookingUrl: "https://babyspa.online/portal/reservas",
      address: "Calle Principal #123, Santa Cruz, Bolivia",
    },
    brasil: {
      timezone: "America/Sao_Paulo",
      utcOffset: -3,
      locale: "pt-BR",
      currency: "BRL",
      whatsappNumber: "+55 XX XXXXX-XXXX",
      portalUrl: "https://babyspa.com.br/portal",
      bookingUrl: "https://babyspa.com.br/portal/reservas",
      address: "Rua Principal 123, São Paulo, Brasil",
    },
  }[country];
}

/**
 * Run all daily jobs for a country
 */
export async function runDailyJobs(country: Country): Promise<void> {
  const startTime = Date.now();
  console.log(`\n========================================`);
  console.log(`[Runner] Starting daily jobs for ${country.toUpperCase()}`);
  console.log(`[Runner] Time: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  const prisma = getPrismaClient(country);
  const config = getCountryConfig(country);

  const results: Record<string, { success: boolean; count?: number; error?: string }> = {};

  try {
    // 1. Appointment Reminders
    console.log("\n[Runner] 1/5 - Appointment Reminders");
    try {
      const count = await runAppointmentReminders(prisma, config);
      results.appointmentReminders = { success: true, count };
      console.log(`[Runner] ✓ Appointment reminders processed: ${count}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results.appointmentReminders = { success: false, error: errorMsg };
      console.error(`[Runner] ✗ Appointment reminders failed:`, error);
    }

    // 2. Mesversary Messages
    console.log("\n[Runner] 2/5 - Mesversary Messages");
    try {
      const count = await runMesversaryMessages(prisma, config);
      results.mesversary = { success: true, count };
      console.log(`[Runner] ✓ Mesversary messages processed: ${count}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results.mesversary = { success: false, error: errorMsg };
      console.error(`[Runner] ✗ Mesversary messages failed:`, error);
    }

    // 3. Re-engagement
    console.log("\n[Runner] 3/5 - Re-engagement");
    try {
      const count = await runReengagement(prisma, config);
      results.reengagement = { success: true, count };
      console.log(`[Runner] ✓ Re-engagement processed: ${count}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results.reengagement = { success: false, error: errorMsg };
      console.error(`[Runner] ✗ Re-engagement failed:`, error);
    }

    // 4. Lead Alerts
    console.log("\n[Runner] 4/5 - Lead Alerts");
    try {
      const count = await runLeadAlerts(prisma, config);
      results.leadAlerts = { success: true, count };
      console.log(`[Runner] ✓ Lead alerts processed: ${count}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results.leadAlerts = { success: false, error: errorMsg };
      console.error(`[Runner] ✗ Lead alerts failed:`, error);
    }

    // 5. Maintenance
    console.log("\n[Runner] 5/5 - Maintenance");
    try {
      const count = await runMaintenance(prisma, config);
      results.maintenance = { success: true, count };
      console.log(`[Runner] ✓ Maintenance tasks completed: ${count}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      results.maintenance = { success: false, error: errorMsg };
      console.error(`[Runner] ✗ Maintenance failed:`, error);
    }
  } finally {
    await prisma.$disconnect();
  }

  const elapsed = Date.now() - startTime;
  console.log(`\n========================================`);
  console.log(`[Runner] Daily jobs completed for ${country.toUpperCase()}`);
  console.log(`[Runner] Duration: ${elapsed}ms`);
  console.log(`[Runner] Results:`, JSON.stringify(results, null, 2));
  console.log(`========================================\n`);
}

/**
 * Run daily summary email for owners
 */
export async function runDailySummary(country: Country): Promise<void> {
  console.log(`\n[Runner] Sending daily summary for ${country.toUpperCase()}`);

  const prisma = getPrismaClient(country);
  const config = getCountryConfig(country);

  try {
    await sendDailySummary(prisma, config);
    console.log(`[Runner] ✓ Daily summary sent`);
  } catch (error) {
    console.error(`[Runner] ✗ Daily summary failed:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run weekly cleanup jobs
 */
export async function runWeeklyJobs(country: Country): Promise<void> {
  console.log(`\n========================================`);
  console.log(`[Runner] Starting weekly cleanup for ${country.toUpperCase()}`);
  console.log(`========================================\n`);

  const prisma = getPrismaClient(country);
  const config = getCountryConfig(country);

  try {
    const result = await runWeeklyCleanup(prisma, config);
    console.log(`[Runner] ✓ Weekly cleanup completed:`, result);
  } catch (error) {
    console.error(`[Runner] ✗ Weekly cleanup failed:`, error);
  } finally {
    await prisma.$disconnect();
  }
}
