import { prisma } from "@/lib/db";
import { ExpenseCategory, PaymentMethod, Prisma } from "@prisma/client";
import { paymentDetailService } from "./payment-detail-service";
import { activityService } from "./activity-service";
import { toDateOnly } from "@/lib/utils/date-utils";

// ============================================================
// TYPES
// ============================================================

interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

interface CreateExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  reference?: string;
  expenseDate: string; // "YYYY-MM-DD"
  paymentDetails?: PaymentDetailInput[];
  paymentMethod?: PaymentMethod; // Legacy: single payment method
  paymentReference?: string; // Legacy: single payment reference
  createdById: string;
}

interface UpdateExpenseInput {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  reference?: string | null;
  expenseDate?: string;
}

interface ExpenseFilters {
  category?: ExpenseCategory;
  categories?: ExpenseCategory[];
  from?: Date;
  to?: Date;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

interface ExpenseSummary {
  category: ExpenseCategory;
  total: number;
  count: number;
}

// ============================================================
// INCLUDES
// ============================================================

const expenseInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  deletedBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ExpenseInclude;

// ============================================================
// SERVICE
// ============================================================

export const expenseService = {
  // ----------------------
  // CREATE
  // ----------------------

  /**
   * Create an expense
   */
  async create(input: CreateExpenseInput) {
    const {
      category,
      description,
      amount,
      reference,
      expenseDate,
      paymentDetails,
      paymentMethod,
      paymentReference,
      createdById,
    } = input;

    // Normalize payment details
    const normalizedPaymentDetails = paymentDetailService.normalizePaymentInput({
      paymentMethod,
      paymentReference,
      paymentDetails,
      totalAmount: amount,
    });

    // Create expense in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the expense
      const expense = await tx.expense.create({
        data: {
          category,
          description,
          amount: new Prisma.Decimal(amount),
          reference: reference || null,
          expenseDate: toDateOnly(expenseDate),
          createdById,
        },
        include: expenseInclude,
      });

      // 2. Create payment details (split payments)
      if (normalizedPaymentDetails.length > 0) {
        await paymentDetailService.createMany(
          {
            parentType: "EXPENSE",
            parentId: expense.id,
            details: normalizedPaymentDetails,
            createdById,
          },
          tx
        );
      }

      return expense;
    });

    // Log activity (outside transaction)
    try {
      await activityService.logExpenseRegistered(result.id, {
        category: result.category,
        description: result.description,
        amount,
        reference: reference || undefined,
      }, createdById);
    } catch (error) {
      console.error("Error logging expense activity:", error);
    }

    return result;
  },

  // ----------------------
  // READ
  // ----------------------

  /**
   * List expenses with filters
   */
  async list(filters: ExpenseFilters = {}) {
    const {
      category,
      categories,
      from,
      to,
      includeDeleted = false,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ExpenseWhereInput = {};

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Category filter
    if (category) {
      where.category = category;
    } else if (categories && categories.length > 0) {
      where.category = { in: categories };
    }

    // Date range filter
    if (from || to) {
      where.expenseDate = {};
      if (from) where.expenseDate.gte = from;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        where.expenseDate.lte = endOfDay;
      }
    }

    // Execute queries in parallel
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get expense by ID
   */
  async getById(id: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: expenseInclude,
    });

    if (!expense) return null;

    // Get payment details
    const paymentDetails = await paymentDetailService.getByParent(
      "EXPENSE",
      id
    );

    return {
      ...expense,
      paymentDetails,
    };
  },

  /**
   * Get summary by category for a period
   */
  async getSummaryByCategory(from: Date, to: Date): Promise<ExpenseSummary[]> {
    const result = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        deletedAt: null,
        expenseDate: {
          gte: from,
          lte: to,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return result.map((r) => ({
      category: r.category,
      total: Number(r._sum.amount || 0),
      count: r._count,
    }));
  },

  /**
   * Get total expenses for a period
   */
  async getTotal(from: Date, to: Date): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: {
        deletedAt: null,
        expenseDate: {
          gte: from,
          lte: to,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  },

  // ----------------------
  // UPDATE
  // ----------------------

  /**
   * Update an expense
   */
  async update(id: string, input: UpdateExpenseInput) {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new Error("EXPENSE_NOT_FOUND");
    }

    if (expense.deletedAt) {
      throw new Error("CANNOT_UPDATE_DELETED_EXPENSE");
    }

    const updateData: Prisma.ExpenseUpdateInput = {};

    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(input.amount);
    }
    if (input.reference !== undefined) {
      updateData.reference = input.reference;
    }
    if (input.expenseDate !== undefined) {
      updateData.expenseDate = toDateOnly(input.expenseDate);
    }

    return prisma.expense.update({
      where: { id },
      data: updateData,
      include: expenseInclude,
    });
  },

  // ----------------------
  // DELETE (Soft)
  // ----------------------

  /**
   * Soft delete an expense
   */
  async delete(id: string, deletedById: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new Error("EXPENSE_NOT_FOUND");
    }

    if (expense.deletedAt) {
      throw new Error("EXPENSE_ALREADY_DELETED");
    }

    return prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
      include: expenseInclude,
    });
  },
};

// Export types
export type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
  ExpenseSummary,
};
