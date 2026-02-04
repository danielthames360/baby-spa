/**
 * Cron Worker Entry Point
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * This is the main entry point for the PM2 cron worker.
 * It runs separately from the Next.js application.
 *
 * Schedules:
 * - Bolivia: 8:00 AM (UTC-4) = 12:00 UTC
 * - Brasil: 8:00 AM (UTC-3) = 11:00 UTC
 * - Weekly cleanup: Monday 3:00 AM (both timezones)
 * - Daily summary: 9:00 AM (after daily jobs)
 */

import * as cron from "node-cron";
import { runDailyJobs, runWeeklyJobs, runDailySummary } from "./runner";

// Environment check
const isProduction = process.env.NODE_ENV === "production";

console.log("[CronWorker] Starting cron worker...");
console.log(`[CronWorker] Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`[CronWorker] Time: ${new Date().toISOString()}`);

// ===========================================================
// DAILY JOBS - Bolivia (8:00 AM UTC-4 = 12:00 UTC)
// ===========================================================
cron.schedule("0 12 * * *", async () => {
  console.log(`[CronWorker] Starting Bolivia daily jobs at ${new Date().toISOString()}`);
  try {
    await runDailyJobs("bolivia");
    console.log("[CronWorker] Bolivia daily jobs completed successfully");
  } catch (error) {
    console.error("[CronWorker] Bolivia daily jobs failed:", error);
  }
});

// ===========================================================
// DAILY JOBS - Brasil (8:00 AM UTC-3 = 11:00 UTC)
// ===========================================================
cron.schedule("0 11 * * *", async () => {
  console.log(`[CronWorker] Starting Brasil daily jobs at ${new Date().toISOString()}`);
  try {
    await runDailyJobs("brasil");
    console.log("[CronWorker] Brasil daily jobs completed successfully");
  } catch (error) {
    console.error("[CronWorker] Brasil daily jobs failed:", error);
  }
});

// ===========================================================
// DAILY SUMMARY - Bolivia (9:00 AM UTC-4 = 13:00 UTC)
// ===========================================================
cron.schedule("0 13 * * 1-6", async () => {
  console.log(`[CronWorker] Starting Bolivia daily summary at ${new Date().toISOString()}`);
  try {
    await runDailySummary("bolivia");
    console.log("[CronWorker] Bolivia daily summary completed");
  } catch (error) {
    console.error("[CronWorker] Bolivia daily summary failed:", error);
  }
});

// ===========================================================
// DAILY SUMMARY - Brasil (9:00 AM UTC-3 = 12:00 UTC)
// ===========================================================
cron.schedule("0 12 * * 1-6", async () => {
  console.log(`[CronWorker] Starting Brasil daily summary at ${new Date().toISOString()}`);
  try {
    await runDailySummary("brasil");
    console.log("[CronWorker] Brasil daily summary completed");
  } catch (error) {
    console.error("[CronWorker] Brasil daily summary failed:", error);
  }
});

// ===========================================================
// WEEKLY CLEANUP - Bolivia (Monday 3:00 AM UTC-4 = 7:00 UTC)
// ===========================================================
cron.schedule("0 7 * * 1", async () => {
  console.log(`[CronWorker] Starting Bolivia weekly cleanup at ${new Date().toISOString()}`);
  try {
    await runWeeklyJobs("bolivia");
    console.log("[CronWorker] Bolivia weekly cleanup completed");
  } catch (error) {
    console.error("[CronWorker] Bolivia weekly cleanup failed:", error);
  }
});

// ===========================================================
// WEEKLY CLEANUP - Brasil (Monday 3:00 AM UTC-3 = 6:00 UTC)
// ===========================================================
cron.schedule("0 6 * * 1", async () => {
  console.log(`[CronWorker] Starting Brasil weekly cleanup at ${new Date().toISOString()}`);
  try {
    await runWeeklyJobs("brasil");
    console.log("[CronWorker] Brasil weekly cleanup completed");
  } catch (error) {
    console.error("[CronWorker] Brasil weekly cleanup failed:", error);
  }
});

// ===========================================================
// DEVELOPMENT: Run immediately on start (optional)
// ===========================================================
if (!isProduction && process.argv.includes("--run-now")) {
  console.log("[CronWorker] Development mode: Running jobs immediately...");
  const country = process.argv.includes("--brasil") ? "brasil" : "bolivia";
  runDailyJobs(country)
    .then(() => console.log("[CronWorker] Immediate run completed"))
    .catch(console.error);
}

// Keep the process alive
console.log("[CronWorker] Cron worker is running. Waiting for scheduled tasks...");
console.log("[CronWorker] Schedule:");
console.log("  - Bolivia daily: 12:00 UTC (8:00 AM UTC-4)");
console.log("  - Brasil daily: 11:00 UTC (8:00 AM UTC-3)");
console.log("  - Bolivia summary: 13:00 UTC (9:00 AM UTC-4) Mon-Sat");
console.log("  - Brasil summary: 12:00 UTC (9:00 AM UTC-3) Mon-Sat");
console.log("  - Bolivia cleanup: Mondays 7:00 UTC (3:00 AM UTC-4)");
console.log("  - Brasil cleanup: Mondays 6:00 UTC (3:00 AM UTC-3)");
