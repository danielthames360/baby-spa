/**
 * Email Stats API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - Get email statistics
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";
import { EmailStatus } from "@prisma/client";

// GET - Get email statistics
export async function GET(request: Request) {
  try {
    await withAuth(["OWNER"]);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();

    // Get all email logs in the period
    const logs = await prisma.emailLog.findMany({
      where: {
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        category: true,
        sentAt: true,
        templateKey: true,
      },
      orderBy: { sentAt: "desc" },
    });

    // Calculate overall stats
    const stats = {
      total: logs.length,
      delivered: logs.filter(
        (l) => l.status === EmailStatus.DELIVERED || l.status === EmailStatus.OPENED
      ).length,
      opened: logs.filter((l) => l.status === EmailStatus.OPENED).length,
      bounced: logs.filter((l) => l.status === EmailStatus.BOUNCED).length,
      complained: logs.filter((l) => l.status === EmailStatus.COMPLAINED).length,
      sent: logs.filter((l) => l.status === EmailStatus.SENT).length,
    };

    // Calculate by category
    const byCategory: Record<string, { total: number; delivered: number; opened: number; bounced: number }> = {};
    for (const log of logs) {
      if (!byCategory[log.category]) {
        byCategory[log.category] = { total: 0, delivered: 0, opened: 0, bounced: 0 };
      }
      byCategory[log.category].total++;
      if (log.status === EmailStatus.DELIVERED || log.status === EmailStatus.OPENED) {
        byCategory[log.category].delivered++;
      }
      if (log.status === EmailStatus.OPENED) {
        byCategory[log.category].opened++;
      }
      if (log.status === EmailStatus.BOUNCED) {
        byCategory[log.category].bounced++;
      }
    }

    // Calculate by day
    const byDay: Record<string, { total: number; delivered: number; opened: number; bounced: number }> = {};
    for (const log of logs) {
      const day = log.sentAt.toISOString().split("T")[0];
      if (!byDay[day]) {
        byDay[day] = { total: 0, delivered: 0, opened: 0, bounced: 0 };
      }
      byDay[day].total++;
      if (log.status === EmailStatus.DELIVERED || log.status === EmailStatus.OPENED) {
        byDay[day].delivered++;
      }
      if (log.status === EmailStatus.OPENED) {
        byDay[day].opened++;
      }
      if (log.status === EmailStatus.BOUNCED) {
        byDay[day].bounced++;
      }
    }

    // Get problematic emails (bounced or complained)
    const problematicEmails = await prisma.emailLog.findMany({
      where: {
        status: { in: [EmailStatus.BOUNCED, EmailStatus.COMPLAINED] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        parent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Get parents with email issues
    const parentsWithIssues = await prisma.parent.findMany({
      where: {
        emailBounceCount: { gte: 2 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailBounceCount: true,
      },
      orderBy: { emailBounceCount: "desc" },
      take: 10,
    });

    // Calculate rates
    const deliveryRate = stats.total > 0
      ? ((stats.delivered / stats.total) * 100).toFixed(1)
      : "0";
    const openRate = stats.delivered > 0
      ? ((stats.opened / stats.delivered) * 100).toFixed(1)
      : "0";
    const bounceRate = stats.total > 0
      ? ((stats.bounced / stats.total) * 100).toFixed(1)
      : "0";

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      stats,
      rates: {
        delivery: `${deliveryRate}%`,
        open: `${openRate}%`,
        bounce: `${bounceRate}%`,
      },
      byCategory,
      byDay,
      problematicEmails,
      parentsWithIssues,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
