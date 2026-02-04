/**
 * Daily Cron Jobs API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * This endpoint allows manual triggering of daily cron jobs.
 * In production, this is typically called by the PM2 cron worker.
 * Can be triggered manually for testing or recovery purposes.
 *
 * Authentication: Requires OWNER role or cron secret header
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";

// Import job functions
import { runAppointmentReminders } from "@/cron/jobs/daily/appointment-reminders";
import { runMesversaryMessages } from "@/cron/jobs/daily/mesversary-messages";
import { runReengagement } from "@/cron/jobs/daily/reengagement";
import { runLeadAlerts } from "@/cron/jobs/daily/lead-alerts";
import { runMaintenance } from "@/cron/jobs/daily/maintenance";

// Cron secret for external triggers (optional)
const CRON_SECRET = process.env.CRON_SECRET;

// Country configuration
function getCountryConfig(country: "bolivia" | "brasil") {
  return {
    bolivia: {
      timezone: "America/La_Paz",
      utcOffset: -4,
      locale: "es-BO",
      currency: "BOB",
      whatsappNumber: process.env.WHATSAPP_NUMBER_BOLIVIA || "+591 XXX XXX XXX",
      portalUrl: process.env.PORTAL_URL_BOLIVIA || "https://babyspa.online/portal",
      bookingUrl: process.env.BOOKING_URL_BOLIVIA || "https://babyspa.online/portal/reservas",
      address: process.env.ADDRESS_BOLIVIA || "Santa Cruz, Bolivia",
    },
    brasil: {
      timezone: "America/Sao_Paulo",
      utcOffset: -3,
      locale: "pt-BR",
      currency: "BRL",
      whatsappNumber: process.env.WHATSAPP_NUMBER_BRASIL || "+55 XX XXXXX-XXXX",
      portalUrl: process.env.PORTAL_URL_BRASIL || "https://babyspa.com.br/portal",
      bookingUrl: process.env.BOOKING_URL_BRASIL || "https://babyspa.com.br/portal/reservas",
      address: process.env.ADDRESS_BRASIL || "São Paulo, Brasil",
    },
  }[country];
}

export async function POST(request: Request) {
  try {
    // Check for cron secret header (for external triggers)
    const authHeader = request.headers.get("x-cron-secret");
    const isSecretAuth = CRON_SECRET && authHeader === CRON_SECRET;

    if (!isSecretAuth) {
      // Require OWNER role if no secret
      await withAuth(["OWNER"]);
    }

    const { searchParams } = new URL(request.url);
    const country = (searchParams.get("country") as "bolivia" | "brasil") || "bolivia";
    const jobsToRun = searchParams.get("jobs")?.split(",") || ["all"];

    const config = getCountryConfig(country);
    const results: Record<string, { success: boolean; count?: number; error?: string }> = {};
    const startTime = Date.now();

    console.log(`[CronAPI] Starting daily jobs for ${country}`);

    // Run requested jobs
    const shouldRun = (job: string) => jobsToRun.includes("all") || jobsToRun.includes(job);

    if (shouldRun("reminders")) {
      try {
        const count = await runAppointmentReminders(prisma, config);
        results.appointmentReminders = { success: true, count };
      } catch (error) {
        results.appointmentReminders = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    if (shouldRun("mesversary")) {
      try {
        const count = await runMesversaryMessages(prisma, config);
        results.mesversary = { success: true, count };
      } catch (error) {
        results.mesversary = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    if (shouldRun("reengagement")) {
      try {
        const count = await runReengagement(prisma, config);
        results.reengagement = { success: true, count };
      } catch (error) {
        results.reengagement = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    if (shouldRun("leads")) {
      try {
        const count = await runLeadAlerts(prisma, config);
        results.leadAlerts = { success: true, count };
      } catch (error) {
        results.leadAlerts = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    if (shouldRun("maintenance")) {
      try {
        const count = await runMaintenance(prisma, config);
        results.maintenance = { success: true, count };
      } catch (error) {
        results.maintenance = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      country,
      jobs: results,
      duration: elapsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET handler to check cron status
export async function GET() {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    // Get pending messages count
    const pendingMessagesCount = await prisma.pendingMessage.count({
      where: {
        status: "PENDING",
        scheduledFor: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
    });

    // Get today's email count
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const emailsToday = await prisma.emailLog.count({
      where: {
        sentAt: { gte: today },
      },
    });

    return NextResponse.json({
      status: "ok",
      pendingMessagesCount,
      emailsToday,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
