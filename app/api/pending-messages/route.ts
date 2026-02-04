/**
 * Pending Messages API Route
 * Fase 11: Cron Jobs y Mensajería Automatizada
 *
 * GET - List pending WhatsApp messages
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError } from "@/lib/api-utils";
import { PendingMessageStatus, PendingMessageCategory } from "@prisma/client";

// GET - List pending messages
export async function GET(request: Request) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PendingMessageCategory | null;
    const status = (searchParams.get("status") || "PENDING") as PendingMessageStatus;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const now = new Date();

    // Build where clause
    const where: {
      status: PendingMessageStatus;
      scheduledFor?: { lte: Date };
      expiresAt?: { gt: Date };
      category?: PendingMessageCategory;
    } = {
      status,
    };

    // For pending messages, also filter by scheduled and not expired
    if (status === "PENDING") {
      where.scheduledFor = { lte: now };
      where.expiresAt = { gt: now };
    }

    if (category) {
      where.category = category;
    }

    const [messages, total, countsByCategory] = await Promise.all([
      prisma.pendingMessage.findMany({
        where,
        orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
        take: limit,
        skip: offset,
        include: {
          sentBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.pendingMessage.count({ where }),
      prisma.pendingMessage.groupBy({
        by: ["category"],
        where: {
          status: "PENDING",
          scheduledFor: { lte: now },
          expiresAt: { gt: now },
        },
        _count: true,
      }),
    ]);

    // Transform counts
    const counts = countsByCategory.reduce(
      (acc, item) => {
        acc[item.category] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      messages,
      total,
      counts,
      pagination: {
        limit,
        offset,
        hasMore: offset + messages.length < total,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
