/**
 * Pending Messages Count API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - Get count of pending messages (for sidebar badge)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";

// GET - Get pending messages count
export async function GET() {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const now = new Date();

    const count = await prisma.pendingMessage.count({
      where: {
        status: "PENDING",
        scheduledFor: { lte: now },
        expiresAt: { gt: now },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
