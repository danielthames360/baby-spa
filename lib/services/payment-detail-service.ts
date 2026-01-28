import { prisma } from "@/lib/db";
import { PaymentParentType, PaymentMethod, Prisma } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

interface CreateManyInput {
  parentType: PaymentParentType;
  parentId: string;
  details: PaymentDetailInput[];
  createdById?: string | null;
}

// ============================================================
// SERVICE
// ============================================================

export const paymentDetailService = {
  /**
   * Create multiple payment details for a parent record
   * Used for split payments (e.g., 200 cash + 150 card = 350 total)
   */
  async createMany(
    input: CreateManyInput,
    tx?: Prisma.TransactionClient
  ): Promise<{ count: number }> {
    const { parentType, parentId, details, createdById } = input;
    const client = tx || prisma;

    const data = details.map((detail) => ({
      parentType,
      parentId,
      amount: new Prisma.Decimal(detail.amount),
      paymentMethod: detail.paymentMethod,
      reference: detail.reference || null,
      createdById: createdById || null,
    }));

    const result = await client.paymentDetail.createMany({
      data,
    });

    return { count: result.count };
  },

  /**
   * Create a single payment detail
   * Convenience method for non-split payments
   */
  async create(
    parentType: PaymentParentType,
    parentId: string,
    detail: PaymentDetailInput,
    createdById?: string | null,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    return client.paymentDetail.create({
      data: {
        parentType,
        parentId,
        amount: new Prisma.Decimal(detail.amount),
        paymentMethod: detail.paymentMethod,
        reference: detail.reference || null,
        createdById: createdById || null,
      },
    });
  },

  /**
   * Get all payment details for a parent record
   */
  async getByParent(parentType: PaymentParentType, parentId: string) {
    return prisma.paymentDetail.findMany({
      where: {
        parentType,
        parentId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  /**
   * Delete all payment details for a parent record
   * Used when a payment is voided/cancelled
   */
  async deleteByParent(
    parentType: PaymentParentType,
    parentId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    return client.paymentDetail.deleteMany({
      where: {
        parentType,
        parentId,
      },
    });
  },

  /**
   * Get total amount paid for a parent record
   */
  async getTotalByParent(parentType: PaymentParentType, parentId: string) {
    const result = await prisma.paymentDetail.aggregate({
      where: {
        parentType,
        parentId,
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  },

  /**
   * Get payment summary by method for a parent record
   */
  async getSummaryByParent(parentType: PaymentParentType, parentId: string) {
    const details = await prisma.paymentDetail.groupBy({
      by: ["paymentMethod"],
      where: {
        parentType,
        parentId,
      },
      _sum: {
        amount: true,
      },
    });

    return details.map((d) => ({
      paymentMethod: d.paymentMethod,
      total: Number(d._sum.amount || 0),
    }));
  },

  /**
   * Get all payment details for reporting (e.g., by date range, by method)
   */
  async getForReport(options: {
    startDate?: Date;
    endDate?: Date;
    parentType?: PaymentParentType;
    paymentMethod?: PaymentMethod;
  }) {
    const { startDate, endDate, parentType, paymentMethod } = options;

    return prisma.paymentDetail.findMany({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
        ...(parentType && { parentType }),
        ...(paymentMethod && { paymentMethod }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get aggregated totals by payment method for reporting
   */
  async getAggregatedByMethod(options: {
    startDate?: Date;
    endDate?: Date;
    parentType?: PaymentParentType;
  }) {
    const { startDate, endDate, parentType } = options;

    const result = await prisma.paymentDetail.groupBy({
      by: ["paymentMethod"],
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
        ...(parentType && { parentType }),
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return result.map((r) => ({
      paymentMethod: r.paymentMethod,
      total: Number(r._sum.amount || 0),
      count: r._count,
    }));
  },

  /**
   * Helper to normalize payment input (supports both legacy and split payments)
   * - If paymentDetails array is provided, use it
   * - If only paymentMethod is provided, create single detail
   */
  normalizePaymentInput(input: {
    paymentMethod?: PaymentMethod | null;
    paymentReference?: string | null;
    paymentDetails?: PaymentDetailInput[];
    totalAmount: number;
  }): PaymentDetailInput[] {
    const { paymentMethod, paymentReference, paymentDetails, totalAmount } = input;

    // If paymentDetails array is provided and not empty, use it
    if (paymentDetails && paymentDetails.length > 0) {
      return paymentDetails;
    }

    // Fall back to legacy single payment method
    if (paymentMethod) {
      return [
        {
          amount: totalAmount,
          paymentMethod,
          reference: paymentReference || null,
        },
      ];
    }

    // No payment info provided
    return [];
  },
};
