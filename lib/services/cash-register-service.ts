// ============================================================
// CASH REGISTER SERVICE
// Sistema de Arqueo de Caja (Fase 10)
// ============================================================

import { prisma } from "@/lib/db";
import {
  CashRegisterStatus,
  CashExpenseCategory,
  TransactionType,
  UserRole,
  Prisma,
} from "@prisma/client";
import { notificationService } from "./notification-service";
import { activityService } from "./activity-service";

// ============================================================
// TYPES
// ============================================================

interface OpenCashRegisterInput {
  userId: string;
  initialFund: number;
}

interface CloseCashRegisterInput {
  cashRegisterId: string;
  userId: string;
  declaredAmount: number;
  closingNotes?: string;
}

interface AddExpenseInput {
  cashRegisterId: string;
  userId: string;
  amount: number;
  category: CashExpenseCategory;
  description: string;
}

interface ReviewCashRegisterInput {
  cashRegisterId: string;
  reviewerId: string;
  reviewNotes?: string;
  /** Caller's role for defense-in-depth authorization check */
  reviewedByRole?: string;
}

interface ForceCloseCashRegisterInput {
  cashRegisterId: string;
  adminId: string;
  forcedCloseNotes: string;
  /** Caller's role for defense-in-depth authorization check */
  closedByRole?: string;
}

interface ListCashRegistersParams {
  status?: CashRegisterStatus;
  fromDate?: Date;
  toDate?: Date;
  userId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// SERVICE
// ============================================================

export const cashRegisterService = {
  // ============================================================
  // GET CURRENT OPEN CASH REGISTER
  // ============================================================
  async getCurrentCashRegister(userId: string) {
    // Use UTC midnight to avoid timezone bugs in negative offsets (e.g. Bolivia UTC-4)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        openedById: userId,
        status: CashRegisterStatus.OPEN,
        openedAt: {
          gte: today,
        },
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        expenses: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cashRegister) {
      return null;
    }

    // Serialize Decimal fields to numbers for JSON response
    return {
      ...cashRegister,
      initialFund: Number(cashRegister.initialFund),
      declaredAmount: cashRegister.declaredAmount ? Number(cashRegister.declaredAmount) : null,
      expectedAmount: cashRegister.expectedAmount ? Number(cashRegister.expectedAmount) : null,
      difference: cashRegister.difference ? Number(cashRegister.difference) : null,
      expenses: cashRegister.expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
    };
  },

  // ============================================================
  // CHECK IF USER HAS OPEN CASH REGISTER
  // ============================================================
  async hasOpenCashRegister(userId: string): Promise<boolean> {
    const cashRegister = await this.getCurrentCashRegister(userId);
    return cashRegister !== null;
  },

  // ============================================================
  // OPEN CASH REGISTER
  // ============================================================
  async openCashRegister(input: OpenCashRegisterInput) {
    const { userId, initialFund } = input;

    // Check if user already has an open cash register today
    const existing = await this.getCurrentCashRegister(userId);
    if (existing) {
      throw new Error("CASH_REGISTER_ALREADY_OPEN");
    }

    // Get user info for activity log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const cashRegister = await prisma.cashRegister.create({
      data: {
        openedById: userId,
        initialFund: new Prisma.Decimal(initialFund),
        status: CashRegisterStatus.OPEN,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        expenses: true,
      },
    });

    // Log activity
    await activityService.log({
      type: "CASH_REGISTER_OPENED",
      title: "activity.cash_register_opened",
      entityType: "cash_register",
      entityId: cashRegister.id,
      performedById: userId,
      metadata: {
        userName: user?.name,
        initialFund: initialFund,
      },
    });

    // Serialize Decimal fields to numbers for JSON response
    return {
      ...cashRegister,
      initialFund: Number(cashRegister.initialFund),
      declaredAmount: null,
      expectedAmount: null,
      difference: null,
      expenses: [],
    };
  },

  // ============================================================
  // CALCULATE EXPECTED AMOUNT
  // ============================================================
  async calculateExpectedAmount(
    cashRegisterId: string,
    openedAt: Date,
    closedAt: Date
  ): Promise<{ expectedAmount: number; cashIncomeTotal: number; expensesTotal: number }> {
    // Get the cash register with initial fund and expenses
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        expenses: true,
      },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    // Get all INCOME transactions made during this register's session
    const transactions = await prisma.transaction.findMany({
      where: {
        type: TransactionType.INCOME,
        createdAt: {
          gte: openedAt,
          lte: closedAt,
        },
      },
      select: {
        paymentMethods: true,
      },
    });

    // Sum only CASH portions from paymentMethods JSON array
    let cashIncomeTotal = 0;
    for (const tx of transactions) {
      const methods = tx.paymentMethods as Array<{ method: string; amount: number }>;
      for (const pm of methods) {
        if (pm.method === "CASH") {
          cashIncomeTotal += pm.amount;
        }
      }
    }

    const initialFund = Number(cashRegister.initialFund);
    const expensesTotal = cashRegister.expenses.reduce(
      (sum: number, expense: { amount: Prisma.Decimal }) => sum + Number(expense.amount),
      0
    );

    const expectedAmount = initialFund + cashIncomeTotal - expensesTotal;

    return {
      expectedAmount,
      cashIncomeTotal,
      expensesTotal,
    };
  },

  // ============================================================
  // CLOSE CASH REGISTER
  // ============================================================
  async closeCashRegister(input: CloseCashRegisterInput) {
    const { cashRegisterId, userId, declaredAmount, closingNotes } = input;

    // Get the cash register
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    if (cashRegister.openedById !== userId) {
      throw new Error("No puedes cerrar una caja que no abriste");
    }

    if (cashRegister.status !== CashRegisterStatus.OPEN) {
      throw new Error("Esta caja ya está cerrada");
    }

    const closedAt = new Date();

    // Calculate expected amount
    const { expectedAmount, cashIncomeTotal, expensesTotal } = await this.calculateExpectedAmount(
      cashRegisterId,
      cashRegister.openedAt,
      closedAt
    );

    const difference = declaredAmount - expectedAmount;

    // Determine status - Auto-approve if difference is 0
    const status =
      difference === 0 ? CashRegisterStatus.APPROVED : CashRegisterStatus.CLOSED;

    const updated = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        closedAt,
        declaredAmount: new Prisma.Decimal(declaredAmount),
        expectedAmount: new Prisma.Decimal(expectedAmount),
        difference: new Prisma.Decimal(difference),
        closingNotes,
        status,
        // If auto-approved, set review fields
        ...(status === CashRegisterStatus.APPROVED
          ? {
              reviewedById: userId,
              reviewedAt: closedAt,
              reviewNotes: "Auto-aprobado (diferencia = 0)",
            }
          : {}),
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        expenses: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log activity
    await activityService.log({
      type: "CASH_REGISTER_CLOSED",
      title: "activity.cash_register_closed",
      entityType: "cash_register",
      entityId: cashRegisterId,
      performedById: userId,
      metadata: {
        userName: cashRegister.openedBy.name,
        declaredAmount,
        expectedAmount,
        difference,
        cashIncomeTotal,
        expensesTotal,
      },
    });

    // If there's a difference, create notification for admins
    if (difference !== 0) {
      await notificationService.create({
        type: "CASH_REGISTER_DIFFERENCE",
        title: "Arqueo con diferencia",
        message: `${cashRegister.openedBy.name} cerró caja con diferencia de ${difference >= 0 ? "+" : ""}${difference.toFixed(2)}`,
        entityType: "cash_register",
        entityId: cashRegisterId,
        forRole: UserRole.ADMIN,
        metadata: {
          userName: cashRegister.openedBy.name,
          difference,
          declaredAmount,
          expectedAmount,
        },
      });
    }

    return updated;
  },

  // ============================================================
  // ADD EXPENSE
  // ============================================================
  async addCashRegisterExpense(input: AddExpenseInput) {
    const { cashRegisterId, userId, amount, category, description } = input;

    // Verify cash register is open
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    if (cashRegister.status !== CashRegisterStatus.OPEN) {
      throw new Error("CASH_REGISTER_NOT_OPEN");
    }

    // Validate description for OTHER category
    if (category === CashExpenseCategory.OTHER && !description.trim()) {
      throw new Error("EXPENSE_DESCRIPTION_REQUIRED");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const expense = await prisma.cashRegisterExpense.create({
      data: {
        cashRegisterId,
        amount: new Prisma.Decimal(amount),
        category,
        description,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Log activity
    await activityService.log({
      type: "CASH_REGISTER_EXPENSE_ADDED",
      title: "activity.cash_register_expense_added",
      entityType: "cash_register",
      entityId: cashRegisterId,
      performedById: userId,
      metadata: {
        userName: user?.name,
        amount,
        category,
        description,
      },
    });

    return expense;
  },

  // ============================================================
  // REVIEW CASH REGISTER (ADMIN)
  // ============================================================
  async reviewCashRegister(input: ReviewCashRegisterInput) {
    const { cashRegisterId, reviewerId, reviewNotes, reviewedByRole } = input;

    // Defense-in-depth: only ADMIN or OWNER can review cash registers
    if (
      reviewedByRole &&
      reviewedByRole !== UserRole.ADMIN &&
      reviewedByRole !== UserRole.OWNER
    ) {
      throw new Error("NOT_AUTHORIZED_TO_REVIEW");
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    if (cashRegister.status !== CashRegisterStatus.CLOSED) {
      throw new Error("Solo se pueden revisar cajas cerradas pendientes");
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true },
    });

    const updated = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        status: CashRegisterStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        expenses: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log activity
    await activityService.log({
      type: "CASH_REGISTER_REVIEWED",
      title: "activity.cash_register_reviewed",
      entityType: "cash_register",
      entityId: cashRegisterId,
      performedById: reviewerId,
      metadata: {
        reviewerName: reviewer?.name,
        userName: cashRegister.openedBy.name,
        difference: Number(cashRegister.difference),
        reviewNotes,
      },
    });

    return updated;
  },

  // ============================================================
  // FORCE CLOSE CASH REGISTER (ADMIN)
  // ============================================================
  async forceCloseCashRegister(input: ForceCloseCashRegisterInput) {
    const { cashRegisterId, adminId, forcedCloseNotes, closedByRole } = input;

    // Defense-in-depth: only ADMIN or OWNER can force close cash registers
    if (
      closedByRole &&
      closedByRole !== UserRole.ADMIN &&
      closedByRole !== UserRole.OWNER
    ) {
      throw new Error("NOT_AUTHORIZED_TO_FORCE_CLOSE");
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        openedBy: { select: { id: true, name: true } },
      },
    });

    if (!cashRegister) {
      throw new Error("Cash register not found");
    }

    if (cashRegister.status !== CashRegisterStatus.OPEN) {
      throw new Error("Solo se pueden forzar cierres de cajas abiertas");
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true },
    });

    const updated = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        status: CashRegisterStatus.FORCE_CLOSED,
        closedAt: new Date(),
        forcedCloseById: adminId,
        forcedCloseNotes,
      },
      include: {
        openedBy: { select: { id: true, name: true } },
        forcedCloseBy: { select: { id: true, name: true } },
        expenses: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log activity
    await activityService.log({
      type: "CASH_REGISTER_FORCE_CLOSED",
      title: "activity.cash_register_force_closed",
      entityType: "cash_register",
      entityId: cashRegisterId,
      performedById: adminId,
      metadata: {
        adminName: admin?.name,
        userName: cashRegister.openedBy.name,
        forcedCloseNotes,
      },
    });

    return updated;
  },

  // ============================================================
  // GET CASH REGISTER DETAIL
  // ============================================================
  async getCashRegisterDetail(cashRegisterId: string) {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        openedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        forcedCloseBy: { select: { id: true, name: true } },
        expenses: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cashRegister) {
      return null;
    }

    // If closed, get ALL transactions during the shift
    const allPayments: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      category: string;
      referenceId: string;
      createdAt: string;
    }> = [];
    let cashIncome = 0;

    if (cashRegister.closedAt) {
      const transactions = await prisma.transaction.findMany({
        where: {
          type: TransactionType.INCOME,
          createdAt: {
            gte: cashRegister.openedAt,
            lte: cashRegister.closedAt,
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Flatten transactions into individual payment method entries
      for (const tx of transactions) {
        const methods = tx.paymentMethods as Array<{ method: string; amount: number; reference?: string }>;
        for (const pm of methods) {
          allPayments.push({
            id: tx.id,
            amount: pm.amount,
            paymentMethod: pm.method,
            category: tx.category,
            referenceId: tx.referenceId,
            createdAt: tx.createdAt.toISOString(),
          });

          // Calculate cash-only income for arqueo
          if (pm.method === "CASH") {
            cashIncome += pm.amount;
          }
        }
      }
    }

    // Calculate totals by payment method
    const paymentsByMethod = allPayments.reduce((acc, p) => {
      if (!acc[p.paymentMethod]) {
        acc[p.paymentMethod] = { total: 0, count: 0 };
      }
      acc[p.paymentMethod].total += p.amount;
      acc[p.paymentMethod].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const allPaymentsTotal = allPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...cashRegister,
      // Serialize Decimal fields to numbers for JSON response
      initialFund: Number(cashRegister.initialFund),
      declaredAmount: cashRegister.declaredAmount ? Number(cashRegister.declaredAmount) : null,
      expectedAmount: cashRegister.expectedAmount ? Number(cashRegister.expectedAmount) : null,
      difference: cashRegister.difference ? Number(cashRegister.difference) : null,
      expenses: cashRegister.expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        createdAt: e.createdAt.toISOString(),
      })),
      // All payments during shift
      allPayments,
      allPaymentsTotal,
      paymentsByMethod,
      // Cash only for arqueo
      cashIncome,
    };
  },

  // ============================================================
  // LIST CASH REGISTERS (ADMIN)
  // ============================================================
  async listCashRegisters(params: ListCashRegistersParams) {
    const { status, fromDate, toDate, userId, limit = 50, offset = 0 } = params;

    const where: Prisma.CashRegisterWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.openedAt = {};
      if (fromDate) where.openedAt.gte = fromDate;
      if (toDate) where.openedAt.lte = toDate;
    }

    if (userId) {
      where.openedById = userId;
    }

    const [cashRegisters, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        include: {
          openedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
          forcedCloseBy: { select: { id: true, name: true } },
          expenses: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { openedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.cashRegister.count({ where }),
    ]);

    return {
      data: cashRegisters.map((cr) => {
        // Destructure to exclude partial expenses array from spread
        const { expenses, ...rest } = cr;
        return {
          ...rest,
          // Serialize Decimal fields to numbers for JSON response
          initialFund: Number(cr.initialFund),
          declaredAmount: cr.declaredAmount ? Number(cr.declaredAmount) : null,
          expectedAmount: cr.expectedAmount ? Number(cr.expectedAmount) : null,
          difference: cr.difference ? Number(cr.difference) : null,
          expensesTotal: expenses.reduce((sum: number, e) => sum + Number(e.amount), 0),
          // expenses will be populated when detail is fetched
          expenses: [],
        };
      }),
      total,
    };
  },

  // ============================================================
  // GET PENDING REVIEW COUNT
  // ============================================================
  async getPendingReviewCount(): Promise<number> {
    return prisma.cashRegister.count({
      where: {
        status: CashRegisterStatus.CLOSED,
      },
    });
  },
};
