import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { getStartOfDayUTC, getEndOfDayUTC } from "@/lib/utils/date-utils";
import { TransactionCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category") as TransactionCategory | null;
    const voidedById = searchParams.get("voidedById");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build date range filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = getStartOfDayUTC(new Date(from));
    if (to) dateFilter.lte = getEndOfDayUTC(new Date(to));

    const where = {
      voidedAt: { not: null, ...dateFilter },
      isReversal: false,
      ...(category && { category }),
      ...(voidedById && { voidedById }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: true,
          voidedBy: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          reversedBy: { select: { id: true, createdAt: true } },
        },
        orderBy: { voidedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Get summary stats
    const allVoided = await prisma.transaction.findMany({
      where,
      select: { category: true, total: true },
    });

    const summary = {
      totalVoids: allVoided.length,
      totalAmount: allVoided.reduce((sum, t) => sum + Number(t.total), 0),
      byCategory: allVoided.reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Serialize transactions
    const serialized = transactions.map((t) => ({
      id: t.id,
      category: t.category,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      total: Number(t.total),
      subtotal: Number(t.subtotal),
      paymentMethods: t.paymentMethods,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
      voidedAt: t.voidedAt,
      voidedBy: t.voidedBy,
      voidReason: t.voidReason,
      reversedBy: t.reversedBy,
      items: t.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        finalPrice: Number(item.finalPrice),
      })),
    }));

    return successResponse({
      transactions: serialized,
      total,
      page,
      limit,
      summary,
    });
  } catch (error) {
    return handleApiError(error, "fetching void history");
  }
}
