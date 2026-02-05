import { prisma } from "@/lib/db";
import { StaffPaymentType, PaymentMethod, PaymentStatus, PayFrequency, Prisma } from "@prisma/client";
import { paymentDetailService } from "./payment-detail-service";
import { activityService } from "./activity-service";

// ============================================================
// TYPES
// ============================================================

interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
}

interface CreateMovementInput {
  staffId: string;
  type: StaffPaymentType;
  amount: number;
  description: string;
  movementDate?: Date;
  createdById: string;
}

interface CreateSalaryPaymentInput {
  staffId: string;
  periodStart: Date;
  periodEnd: Date;
  baseSalary: number;
  advanceDeducted?: number;
  paymentDetails?: PaymentDetailInput[];
  description: string;
  createdById: string;
}

interface StaffPaymentFilters {
  staffId?: string;
  type?: StaffPaymentType;
  types?: StaffPaymentType[];
  status?: PaymentStatus;
  periodStart?: Date;
  periodEnd?: Date;
  from?: Date;
  to?: Date;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

interface StaffStats {
  sessionsCount: number;
  daysWithSessions: number;
  totalWorkDays: number;
  daysWithoutSessions: number[];
  babyCardsSold: number;
}

interface PeriodDates {
  start: Date;
  end: Date;
}

// Movement types (records that accumulate)
const MOVEMENT_TYPES: StaffPaymentType[] = [
  "BONUS",
  "COMMISSION",
  "BENEFIT",
  "DEDUCTION",
];

// Payment types (actual money transfers)
const PAYMENT_TYPES: StaffPaymentType[] = [
  "SALARY",
  "ADVANCE",
  "ADVANCE_RETURN",
  "SETTLEMENT",
];

// Income types (positive for employee)
const INCOME_TYPES: StaffPaymentType[] = [
  "SALARY",
  "COMMISSION",
  "BONUS",
  "BENEFIT",
  "SETTLEMENT",
  "ADVANCE",
];

// Expense types (negative for employee)
const EXPENSE_TYPES: StaffPaymentType[] = [
  "DEDUCTION",
  "ADVANCE_RETURN",
];

// ============================================================
// INCLUDES
// ============================================================

const staffPaymentInclude = {
  staff: {
    select: {
      id: true,
      name: true,
      baseSalary: true,
      payFrequency: true,
    },
  },
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
  includedInSalary: {
    select: {
      id: true,
      paidAt: true,
    },
  },
} satisfies Prisma.StaffPaymentInclude;

// ============================================================
// HELPERS
// ============================================================

/**
 * Calculate work days in a period (Mon-Sat)
 * Uses UTC methods to avoid timezone issues with database dates
 */
function getWorkDaysInPeriod(start: Date, end: Date): number[] {
  const workDays: number[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    // 1-6 = Mon-Sat (work days), 0 = Sunday (closed)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      workDays.push(current.getUTCDate());
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workDays;
}

/**
 * Calculate period dates based on frequency and a reference date
 * Uses UTC methods to avoid timezone issues with database dates
 */
function calculatePeriodDates(date: Date, frequency: PayFrequency): PeriodDates {
  // Use UTC methods to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (frequency) {
    case "DAILY":
      // Same day
      return {
        start: new Date(Date.UTC(year, month, day, 12, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 12, 0, 0)),
      };

    case "WEEKLY": {
      // Monday to Sunday of that week
      const dayOfWeek = date.getUTCDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(Date.UTC(year, month, day + diffToMonday, 12, 0, 0));
      const sunday = new Date(Date.UTC(year, month, day + diffToMonday + 6, 12, 0, 0));

      return {
        start: monday,
        end: sunday,
      };
    }

    case "BIWEEKLY": {
      // 1-15 or 16-end of month
      if (day <= 15) {
        return {
          start: new Date(Date.UTC(year, month, 1, 12, 0, 0)),
          end: new Date(Date.UTC(year, month, 15, 12, 0, 0)),
        };
      } else {
        // Get last day of month using UTC
        const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0)).getUTCDate();
        return {
          start: new Date(Date.UTC(year, month, 16, 12, 0, 0)),
          end: new Date(Date.UTC(year, month, lastDay, 12, 0, 0)),
        };
      }
    }

    case "MONTHLY":
    default: {
      // Full month - get last day using UTC
      const lastDay = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0)).getUTCDate();
      return {
        start: new Date(Date.UTC(year, month, 1, 12, 0, 0)),
        end: new Date(Date.UTC(year, month, lastDay, 12, 0, 0)),
      };
    }
  }
}

/**
 * Get the salary amount per period based on frequency
 */
function getSalaryPerPeriod(baseMonthlySalary: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "DAILY":
      return baseMonthlySalary / 30; // Approximate
    case "WEEKLY":
      return baseMonthlySalary / 4;
    case "BIWEEKLY":
      return baseMonthlySalary / 2;
    case "MONTHLY":
    default:
      return baseMonthlySalary;
  }
}

// ============================================================
// SERVICE
// ============================================================

export const staffPaymentService = {
  // ----------------------
  // PERIOD HELPERS
  // ----------------------

  calculatePeriodDates,
  getSalaryPerPeriod,

  /**
   * Check if a type is a movement (accumulates) vs payment (actual money)
   */
  isMovementType(type: StaffPaymentType): boolean {
    return MOVEMENT_TYPES.includes(type);
  },

  /**
   * Check if a type is income (positive) for employee
   */
  isIncomeType(type: StaffPaymentType): boolean {
    return INCOME_TYPES.includes(type);
  },

  // ----------------------
  // CREATE MOVEMENT
  // ----------------------

  /**
   * Create a movement (record that accumulates, not a payment yet)
   * Used for: BONUS, COMMISSION, BENEFIT, DEDUCTION
   */
  async createMovement(input: CreateMovementInput) {
    const { staffId, type, amount, description, movementDate, createdById } = input;

    // Get staff info to determine period
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { payFrequency: true },
    });

    if (!staff) {
      throw new Error("STAFF_NOT_FOUND");
    }

    // Calculate period based on movement date and staff's pay frequency
    const dateForPeriod = movementDate || new Date();
    const { start: periodStart, end: periodEnd } = calculatePeriodDates(
      dateForPeriod,
      staff.payFrequency
    );

    // Check if the period is already paid (has a SALARY for this period)
    const existingSalary = await prisma.staffPayment.findFirst({
      where: {
        staffId,
        type: "SALARY",
        deletedAt: null,
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
      },
    });

    if (existingSalary) {
      throw new Error("PERIOD_ALREADY_PAID");
    }

    // For deductions, store as negative
    const isExpense = EXPENSE_TYPES.includes(type);
    const grossAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);

    const movement = await prisma.staffPayment.create({
      data: {
        staffId,
        type,
        status: "PENDING",
        grossAmount: new Prisma.Decimal(grossAmount),
        netAmount: new Prisma.Decimal(grossAmount), // Same as gross for movements
        description,
        periodStart,
        periodEnd,
        movementDate: movementDate || new Date(),
        periodMonth: periodStart.getMonth() + 1,
        periodYear: periodStart.getFullYear(),
        paidAt: null, // Not paid yet
        createdById,
      },
      include: staffPaymentInclude,
    });

    return movement;
  },

  // ----------------------
  // CREATE ADVANCE
  // ----------------------

  /**
   * Create an advance payment (actual money given to employee)
   * This is an actual payment, not a movement
   */
  async createAdvance(input: {
    staffId: string;
    amount: number;
    description: string;
    paymentDetails?: PaymentDetailInput[];
    createdById: string;
  }) {
    const { staffId, amount, description, paymentDetails, createdById } = input;

    // Get staff info
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { payFrequency: true, name: true },
    });

    if (!staff) {
      throw new Error("STAFF_NOT_FOUND");
    }

    const now = new Date();
    const { start: periodStart, end: periodEnd } = calculatePeriodDates(
      now,
      staff.payFrequency
    );

    const result = await prisma.$transaction(async (tx) => {
      // Create the advance payment
      const payment = await tx.staffPayment.create({
        data: {
          staffId,
          type: "ADVANCE",
          status: "PAID", // Advances are immediately paid
          grossAmount: new Prisma.Decimal(amount),
          netAmount: new Prisma.Decimal(amount),
          description,
          periodStart,
          periodEnd,
          movementDate: now,
          periodMonth: periodStart.getMonth() + 1,
          periodYear: periodStart.getFullYear(),
          paidAt: now,
          createdById,
        },
        include: staffPaymentInclude,
      });

      // Create payment details
      if (paymentDetails && paymentDetails.length > 0) {
        await paymentDetailService.createMany(
          {
            parentType: "STAFF_PAYMENT",
            parentId: payment.id,
            details: paymentDetails,
            createdById,
          },
          tx
        );
      }

      // Update advance balance (increase debt)
      await this.updateAdvanceBalance(tx, staffId, "ADVANCE", amount);

      return payment;
    });

    // Log activity
    try {
      await activityService.logStaffPaymentRegistered(result.id, {
        staffName: staff.name,
        type: "ADVANCE",
        grossAmount: amount,
        netAmount: amount,
        advanceDeducted: 0,
        description,
      }, createdById);
    } catch (error) {
      console.error("Error logging advance activity:", error);
    }

    return result;
  },

  // ----------------------
  // CREATE ADVANCE RETURN
  // ----------------------

  /**
   * Register an advance return (employee pays back)
   */
  async createAdvanceReturn(input: {
    staffId: string;
    amount: number;
    description: string;
    createdById: string;
  }) {
    const { staffId, amount, description, createdById } = input;

    // Validate: cannot return more than owed
    const balance = await this.getAdvanceBalance(staffId);
    if (amount > balance) {
      throw new Error("ADVANCE_RETURN_EXCEEDS_BALANCE");
    }

    // Get staff info
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { payFrequency: true, name: true },
    });

    if (!staff) {
      throw new Error("STAFF_NOT_FOUND");
    }

    const now = new Date();
    const { start: periodStart, end: periodEnd } = calculatePeriodDates(
      now,
      staff.payFrequency
    );

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.staffPayment.create({
        data: {
          staffId,
          type: "ADVANCE_RETURN",
          status: "PAID",
          grossAmount: new Prisma.Decimal(-amount), // Negative (employee pays)
          netAmount: new Prisma.Decimal(-amount),
          description,
          periodStart,
          periodEnd,
          movementDate: now,
          periodMonth: periodStart.getMonth() + 1,
          periodYear: periodStart.getFullYear(),
          paidAt: now,
          createdById,
        },
        include: staffPaymentInclude,
      });

      // Update advance balance (decrease debt)
      await this.updateAdvanceBalance(tx, staffId, "ADVANCE_RETURN", amount);

      return payment;
    });

    return result;
  },

  // ----------------------
  // CREATE SALARY PAYMENT
  // ----------------------

  /**
   * Create a salary payment that consolidates all pending movements
   */
  async createSalaryPayment(input: CreateSalaryPaymentInput) {
    const {
      staffId,
      periodStart,
      periodEnd,
      baseSalary,
      advanceDeducted,
      paymentDetails,
      description,
      createdById,
    } = input;

    // Check for existing salary payment in the same or overlapping period
    const existingSalary = await prisma.staffPayment.findFirst({
      where: {
        staffId,
        type: "SALARY",
        deletedAt: null,
        OR: [
          // Exact same period
          {
            periodStart: { equals: periodStart },
            periodEnd: { equals: periodEnd },
          },
          // Overlapping: existing starts within new period
          {
            periodStart: { gte: periodStart, lte: periodEnd },
          },
          // Overlapping: existing ends within new period
          {
            periodEnd: { gte: periodStart, lte: periodEnd },
          },
          // Overlapping: new period is entirely within existing
          {
            periodStart: { lte: periodStart },
            periodEnd: { gte: periodEnd },
          },
        ],
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
      },
    });

    if (existingSalary) {
      throw new Error("SALARY_ALREADY_PAID_FOR_PERIOD");
    }

    // Validate advance deduction
    if (advanceDeducted && advanceDeducted > 0) {
      const balance = await this.getAdvanceBalance(staffId);
      if (advanceDeducted > balance) {
        throw new Error("ADVANCE_DEDUCTION_EXCEEDS_BALANCE");
      }
    }

    // Get pending movements for this period
    const pendingMovements = await this.getPendingMovements(staffId, periodStart, periodEnd);

    // Calculate totals
    const movementsTotal = pendingMovements.reduce(
      (sum, m) => sum + Number(m.grossAmount),
      0
    );

    const grossAmount = baseSalary + movementsTotal;
    const netAmount = grossAmount - (advanceDeducted || 0);

    // Get staff name for activity log
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { name: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Create the salary payment
      const payment = await tx.staffPayment.create({
        data: {
          staffId,
          type: "SALARY",
          status: "PAID",
          grossAmount: new Prisma.Decimal(grossAmount),
          netAmount: new Prisma.Decimal(netAmount),
          advanceDeducted: advanceDeducted
            ? new Prisma.Decimal(advanceDeducted)
            : null,
          description,
          periodStart,
          periodEnd,
          periodMonth: periodStart.getMonth() + 1,
          periodYear: periodStart.getFullYear(),
          paidAt: new Date(),
          createdById,
        },
        include: staffPaymentInclude,
      });

      // Create payment details
      if (paymentDetails && paymentDetails.length > 0 && netAmount > 0) {
        await paymentDetailService.createMany(
          {
            parentType: "STAFF_PAYMENT",
            parentId: payment.id,
            details: paymentDetails,
            createdById,
          },
          tx
        );
      }

      // Mark pending movements as included in this salary
      if (pendingMovements.length > 0) {
        await tx.staffPayment.updateMany({
          where: {
            id: { in: pendingMovements.map((m) => m.id) },
          },
          data: {
            status: "PAID",
            includedInSalaryId: payment.id,
          },
        });
      }

      // Update advance balance
      if (advanceDeducted && advanceDeducted > 0) {
        await this.updateAdvanceBalance(tx, staffId, "SALARY", 0, advanceDeducted);
      }

      return payment;
    });

    // Log activity
    try {
      await activityService.logStaffPaymentRegistered(result.id, {
        staffName: staff?.name || "Unknown",
        type: "SALARY",
        grossAmount,
        netAmount,
        advanceDeducted: advanceDeducted || 0,
        description,
      }, createdById);
    } catch (error) {
      console.error("Error logging salary activity:", error);
    }

    return result;
  },

  // ----------------------
  // ADVANCE BALANCE
  // ----------------------

  /**
   * Update advance balance based on payment type
   */
  async updateAdvanceBalance(
    tx: Prisma.TransactionClient,
    staffId: string,
    type: StaffPaymentType,
    amount: number,
    advanceDeducted?: number
  ) {
    // Get or create advance balance record
    let balance = await tx.staffAdvanceBalance.findUnique({
      where: { staffId },
    });

    if (!balance) {
      balance = await tx.staffAdvanceBalance.create({
        data: { staffId, currentBalance: new Prisma.Decimal(0) },
      });
    }

    let newBalance = Number(balance.currentBalance);

    switch (type) {
      case "ADVANCE":
        newBalance += amount;
        break;
      case "ADVANCE_RETURN":
        newBalance -= amount;
        break;
      case "SETTLEMENT":
        newBalance = 0;
        break;
      default:
        if (advanceDeducted && advanceDeducted > 0) {
          newBalance -= advanceDeducted;
        }
        break;
    }

    newBalance = Math.max(0, newBalance);

    await tx.staffAdvanceBalance.update({
      where: { staffId },
      data: { currentBalance: new Prisma.Decimal(newBalance) },
    });
  },

  /**
   * Get advance balance for a staff member
   */
  async getAdvanceBalance(staffId: string): Promise<number> {
    const balance = await prisma.staffAdvanceBalance.findUnique({
      where: { staffId },
    });
    return Number(balance?.currentBalance || 0);
  },

  // ----------------------
  // READ
  // ----------------------

  /**
   * Get pending movements for a staff member in a period
   */
  async getPendingMovements(staffId: string, periodStart: Date, periodEnd: Date) {
    return prisma.staffPayment.findMany({
      where: {
        staffId,
        status: "PENDING",
        deletedAt: null,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      include: staffPaymentInclude,
      orderBy: { movementDate: "asc" },
    });
  },

  /**
   * Get summary for salary calculation
   */
  async getSalaryPreview(staffId: string, periodStart: Date, periodEnd: Date) {
    const [staff, pendingMovements, advanceBalance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: staffId },
        select: { baseSalary: true, payFrequency: true, name: true },
      }),
      this.getPendingMovements(staffId, periodStart, periodEnd),
      this.getAdvanceBalance(staffId),
    ]);

    if (!staff) {
      throw new Error("STAFF_NOT_FOUND");
    }

    const baseSalaryPerPeriod = getSalaryPerPeriod(
      Number(staff.baseSalary || 0),
      staff.payFrequency
    );

    // Separate income and expense movements
    const incomeMovements = pendingMovements.filter(
      (m) => Number(m.grossAmount) > 0
    );
    const expenseMovements = pendingMovements.filter(
      (m) => Number(m.grossAmount) < 0
    );

    const totalIncome = incomeMovements.reduce(
      (sum, m) => sum + Number(m.grossAmount),
      0
    );
    const totalExpenses = Math.abs(
      expenseMovements.reduce((sum, m) => sum + Number(m.grossAmount), 0)
    );

    const grossAmount = baseSalaryPerPeriod + totalIncome - totalExpenses;
    const suggestedAdvanceDeduction = Math.min(advanceBalance, grossAmount);
    const netAmount = grossAmount - suggestedAdvanceDeduction;

    return {
      staff: {
        id: staffId,
        name: staff.name,
        baseSalary: Number(staff.baseSalary || 0),
        payFrequency: staff.payFrequency,
      },
      period: { start: periodStart, end: periodEnd },
      baseSalaryPerPeriod,
      movements: {
        income: incomeMovements,
        expenses: expenseMovements,
        totalIncome,
        totalExpenses,
      },
      advanceBalance,
      suggestedAdvanceDeduction,
      grossAmount,
      netAmount,
    };
  },

  /**
   * List staff payments with filters
   */
  async list(filters: StaffPaymentFilters = {}) {
    const {
      staffId,
      type,
      types,
      status,
      periodStart,
      periodEnd,
      from,
      to,
      includeDeleted = false,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.StaffPaymentWhereInput = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (type) {
      where.type = type;
    } else if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (status) {
      where.status = status;
    }

    // Period filter
    if (periodStart && periodEnd) {
      where.AND = [
        { periodStart: { gte: periodStart } },
        { periodEnd: { lte: periodEnd } },
      ];
    }

    // Date range filter (for paidAt)
    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = from;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        where.paidAt.lte = endOfDay;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.staffPayment.findMany({
        where,
        include: staffPaymentInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staffPayment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get staff payment by ID
   */
  async getById(id: string) {
    const payment = await prisma.staffPayment.findUnique({
      where: { id },
      include: {
        ...staffPaymentInclude,
        includedMovements: {
          include: staffPaymentInclude,
        },
      },
    });

    if (!payment) return null;

    const paymentDetails = await paymentDetailService.getByParent(
      "STAFF_PAYMENT",
      id
    );

    return {
      ...payment,
      paymentDetails,
    };
  },

  /**
   * Get staff statistics for a period
   */
  async getStaffStats(
    staffId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<StaffStats> {
    const sessions = await prisma.session.findMany({
      where: {
        therapistId: staffId,
        status: "COMPLETED",
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        completedAt: true,
      },
    });

    const daysWithSessionsSet = new Set<number>();
    sessions.forEach((s) => {
      if (s.completedAt) {
        daysWithSessionsSet.add(s.completedAt.getUTCDate());
      }
    });

    const workDays = getWorkDaysInPeriod(periodStart, periodEnd);
    const daysWithSessions = Array.from(daysWithSessionsSet);
    const daysWithoutSessions = workDays.filter(
      (day) => !daysWithSessionsSet.has(day)
    );

    const babyCardsSold = await prisma.babyCardPurchase.count({
      where: {
        createdById: staffId,
        purchaseDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    return {
      sessionsCount: sessions.length,
      daysWithSessions: daysWithSessions.length,
      totalWorkDays: workDays.length,
      daysWithoutSessions,
      babyCardsSold,
    };
  },

  /**
   * Get all staff members with their current advance balances
   */
  async getStaffWithBalances() {
    const staff = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["THERAPIST", "RECEPTION"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        baseSalary: true,
        payFrequency: true,
        advanceBalance: {
          select: {
            currentBalance: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      baseSalary: Number(s.baseSalary || 0),
      payFrequency: s.payFrequency,
      advanceBalance: Number(s.advanceBalance?.currentBalance || 0),
    }));
  },

  // ----------------------
  // DELETE (Soft)
  // ----------------------

  /**
   * Soft delete a staff payment
   */
  async delete(id: string, deletedById: string) {
    const payment = await prisma.staffPayment.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    if (payment.deletedAt) {
      throw new Error("PAYMENT_ALREADY_DELETED");
    }

    // Cannot delete a movement that's already included in a salary payment
    if (payment.includedInSalaryId) {
      throw new Error("CANNOT_DELETE_MOVEMENT_INCLUDED_IN_SALARY");
    }

    // Check if this payment affected advance balance
    if (
      payment.type === "ADVANCE" ||
      payment.type === "ADVANCE_RETURN" ||
      payment.advanceDeducted
    ) {
      const subsequentPayments = await prisma.staffPayment.count({
        where: {
          staffId: payment.staffId,
          createdAt: { gt: payment.createdAt },
          deletedAt: null,
          OR: [
            { type: "ADVANCE" },
            { type: "ADVANCE_RETURN" },
            { advanceDeducted: { not: null } },
          ],
        },
      });

      if (subsequentPayments > 0) {
        throw new Error("CANNOT_DELETE_PAYMENT_WITH_SUBSEQUENT_ADVANCE_ACTIVITY");
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.staffPayment.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById,
        },
        include: staffPaymentInclude,
      });

      // Reverse advance balance
      if (payment.type === "ADVANCE") {
        await tx.staffAdvanceBalance.update({
          where: { staffId: payment.staffId },
          data: {
            currentBalance: {
              decrement: payment.grossAmount,
            },
          },
        });
      } else if (payment.type === "ADVANCE_RETURN") {
        await tx.staffAdvanceBalance.update({
          where: { staffId: payment.staffId },
          data: {
            currentBalance: {
              increment: new Prisma.Decimal(Math.abs(Number(payment.grossAmount))),
            },
          },
        });
      } else if (payment.advanceDeducted) {
        await tx.staffAdvanceBalance.update({
          where: { staffId: payment.staffId },
          data: {
            currentBalance: {
              increment: payment.advanceDeducted,
            },
          },
        });
      }

      // If this was a salary, release the included movements back to pending
      if (payment.type === "SALARY") {
        await tx.staffPayment.updateMany({
          where: { includedInSalaryId: id },
          data: {
            status: "PENDING",
            includedInSalaryId: null,
          },
        });
      }

      return deleted;
    });

    return result;
  },
};

// Export types
export type { CreateMovementInput, CreateSalaryPaymentInput, StaffPaymentFilters, StaffStats, PeriodDates };
