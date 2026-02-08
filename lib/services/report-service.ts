import { prisma } from "@/lib/db";
import { AppointmentStatus, PaymentMethod, Prisma, TransactionCategory } from "@prisma/client";
import { getPaymentStatus, type PackagePurchaseForPayment } from "@/lib/utils/installments";
import { type PaymentMethodEntry } from "@/lib/services/transaction-service";

// ============================================================
// TYPES
// ============================================================

interface DashboardKPIs {
  // Ingresos del período
  totalIncome: number;
  incomeByMethod: { method: PaymentMethod; amount: number }[];
  // Operaciones
  totalAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  cancelledAppointments: number;
  // Clientes
  activeBabies: number;
  newBabiesThisMonth: number;
  // Inventario
  lowStockProducts: number;
  outOfStockProducts: number;
  // Evaluaciones
  pendingEvaluations: number;
  // Cuentas por cobrar
  totalReceivables: number;
  overdueReceivables: number;
}

interface IncomeByDay {
  date: string;
  total: number;
  byMethod: { method: PaymentMethod; amount: number }[];
}

// Income categories (TransactionCategory values that represent income)
const INCOME_CATEGORIES: TransactionCategory[] = [
  "SESSION",
  "BABY_CARD",
  "EVENT_REGISTRATION",
  "APPOINTMENT_ADVANCE",
  "PACKAGE_INSTALLMENT",
  "PACKAGE_SALE",
  "SESSION_PRODUCTS",
  "EVENT_PRODUCTS",
];

type IncomeSource = TransactionCategory;

interface IncomeReport {
  total: number;
  grossTotal: number;
  totalDiscounts: number;
  discountsByCategory: { category: string; amount: number; count: number }[];
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  bySource: { source: IncomeSource; amount: number; count: number }[];
  byDay: IncomeByDay[];
}

interface ReceivableItem {
  id: string;
  babyId: string;
  babyName: string;
  parentName: string;
  parentPhone: string | null;
  packageName: string;
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  installmentsPending: number;
  isOverdue: boolean;
  createdAt: Date;
}

interface AttendanceStats {
  date: string;
  completed: number;
  noShow: number;
  cancelled: number;
  total: number;
}

interface NoShowItem {
  id: string;
  date: Date;
  startTime: string;
  babyName: string;
  parentName: string;
  parentPhone: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  status: "ok" | "low" | "out";
  lastMovementDate: Date | null;
}

interface PendingEvaluation {
  id: string;
  appointmentId: string;
  date: Date;
  startTime: string;
  babyId: string;
  babyName: string;
  therapistId: string;
  therapistName: string;
  sessionNumber: number;
  completedAt: Date | null;
}

// ============================================================
// SERVICE
// ============================================================

export const reportService = {
  // ----------------------
  // DASHBOARD KPIs
  // ----------------------

  async getDashboardKPIs(from: Date, to: Date): Promise<DashboardKPIs> {
    const [
      transactions,
      appointmentStats,
      activeBabies,
      newBabies,
      inventoryStats,
      pendingEvaluations,
      receivablesData,
    ] = await Promise.all([
      // Ingresos del período (de Transaction con TODAS las categorías de ingreso)
      prisma.transaction.findMany({
        where: {
          type: "INCOME",
          category: { in: INCOME_CATEGORIES },
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        select: { total: true, paymentMethods: true },
      }),
      // Estadísticas de citas
      prisma.appointment.groupBy({
        by: ["status"],
        where: {
          date: { gte: from, lte: to },
        },
        _count: true,
      }),
      // Bebés activos (con cita en los últimos 3 meses)
      prisma.baby.count({
        where: {
          isActive: true,
          appointments: {
            some: {
              date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            },
          },
        },
      }),
      // Nuevos bebés este mes
      prisma.baby.count({
        where: {
          createdAt: { gte: from, lte: to },
        },
      }),
      // Productos con stock bajo o agotados
      prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, minStock: true },
      }).then((products: { currentStock: number; minStock: number }[]) => {
        const lowStock = products.filter(
          (p) => p.currentStock > 0 && p.currentStock <= p.minStock
        ).length;
        const outOfStock = products.filter((p) => p.currentStock === 0).length;
        return { lowStock, outOfStock };
      }),
      // Evaluaciones pendientes
      prisma.session.count({
        where: {
          status: { in: ["PENDING", "EVALUATED"] },
          completedAt: { not: null },
          evaluation: null,
        },
      }),
      // Cuentas por cobrar (con datos para calcular overdue)
      prisma.packagePurchase.findMany({
        where: {
          isActive: true,
          paymentPlan: "INSTALLMENTS",
        },
        select: {
          totalPrice: true,
          finalPrice: true,
          paidAmount: true,
          usedSessions: true,
          totalSessions: true,
          remainingSessions: true,
          paymentPlan: true,
          installments: true,
          installmentAmount: true,
          installmentsPayOnSessions: true,
        },
      }),
    ]);

    // Procesar resultados - aggregate income from transactions
    const totalIncome = transactions.reduce(
      (sum: number, t) => sum + Number(t.total || 0),
      0
    );

    // Aggregate by payment method from JSON paymentMethods field
    const methodTotals = new Map<PaymentMethod, number>();
    for (const t of transactions) {
      const methods = t.paymentMethods as unknown as PaymentMethodEntry[];
      for (const pm of methods) {
        methodTotals.set(pm.method, (methodTotals.get(pm.method) || 0) + pm.amount);
      }
    }
    const incomeByMethod = Array.from(methodTotals.entries()).map(([method, amount]) => ({
      method,
      amount,
    }));

    const appointmentsByStatus = Object.fromEntries(
      appointmentStats.map((a) => [a.status, a._count])
    ) as Record<AppointmentStatus, number>;

    // Calculate receivables and overdue amounts
    let totalReceivables = 0;
    let overdueReceivables = 0;

    for (const purchase of receivablesData) {
      const totalPrice = Number(purchase.totalPrice || purchase.finalPrice);
      const paidAmount = Number(purchase.paidAmount);
      const pendingAmount = totalPrice - paidAmount;

      if (pendingAmount > 0) {
        totalReceivables += pendingAmount;

        // Calculate overdue using installments logic
        const purchaseForPayment: PackagePurchaseForPayment = {
          usedSessions: purchase.usedSessions,
          totalSessions: purchase.totalSessions,
          remainingSessions: purchase.remainingSessions,
          paymentPlan: purchase.paymentPlan,
          installments: purchase.installments,
          installmentAmount: purchase.installmentAmount,
          totalPrice: purchase.totalPrice,
          finalPrice: purchase.finalPrice,
          paidAmount: purchase.paidAmount,
          installmentsPayOnSessions: purchase.installmentsPayOnSessions,
        };

        const status = getPaymentStatus(purchaseForPayment);
        overdueReceivables += status.overdueAmount;
      }
    }

    return {
      totalIncome,
      incomeByMethod,
      totalAppointments: Object.values(appointmentsByStatus).reduce(
        (a, b) => a + b,
        0
      ),
      completedAppointments: appointmentsByStatus.COMPLETED || 0,
      noShowAppointments: appointmentsByStatus.NO_SHOW || 0,
      cancelledAppointments: appointmentsByStatus.CANCELLED || 0,
      activeBabies,
      newBabiesThisMonth: newBabies,
      lowStockProducts: inventoryStats.lowStock,
      outOfStockProducts: inventoryStats.outOfStock,
      pendingEvaluations,
      totalReceivables,
      overdueReceivables,
    };
  },

  // ----------------------
  // INCOME REPORT
  // ----------------------

  async getIncomeReport(from: Date, to: Date): Promise<IncomeReport> {
    const [byCategory, transactions, discountsByCategory] = await Promise.all([
      // Total por categoría (source)
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          type: "INCOME",
          category: { in: INCOME_CATEGORIES },
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        _sum: { total: true },
        _count: true,
      }),
      // All transactions for method breakdown and daily grouping
      prisma.transaction.findMany({
        where: {
          type: "INCOME",
          category: { in: INCOME_CATEGORIES },
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        select: {
          total: true,
          subtotal: true,
          discountTotal: true,
          paymentMethods: true,
          createdAt: true,
          category: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      // Discounts grouped by category
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          type: "INCOME",
          category: { in: INCOME_CATEGORIES },
          createdAt: { gte: from, lte: to },
          discountTotal: { gt: 0 },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        _sum: { discountTotal: true },
        _count: true,
      }),
    ]);

    // Aggregate by payment method and count transactions per method
    const methodTotals = new Map<PaymentMethod, { amount: number; count: number }>();
    const byDayMap = new Map<string, { total: number; byMethod: Map<PaymentMethod, number> }>();

    for (const t of transactions) {
      const methods = t.paymentMethods as unknown as PaymentMethodEntry[];
      const dateKey = t.createdAt.toISOString().split("T")[0];

      if (!byDayMap.has(dateKey)) {
        byDayMap.set(dateKey, { total: 0, byMethod: new Map() });
      }
      const day = byDayMap.get(dateKey)!;
      day.total += Number(t.total);

      for (const pm of methods) {
        // Aggregate by method
        const current = methodTotals.get(pm.method) || { amount: 0, count: 0 };
        current.amount += pm.amount;
        current.count += 1;
        methodTotals.set(pm.method, current);

        // Daily breakdown
        day.byMethod.set(pm.method, (day.byMethod.get(pm.method) || 0) + pm.amount);
      }
    }

    const byDay: IncomeByDay[] = Array.from(byDayMap.entries()).map(
      ([date, data]) => ({
        date,
        total: data.total,
        byMethod: Array.from(data.byMethod.entries()).map(([method, amount]) => ({
          method,
          amount,
        })),
      })
    );

    const total = byCategory.reduce(
      (sum: number, c) => sum + Number(c._sum.total || 0),
      0
    );

    // Calculate gross total and discounts
    const grossTotal = transactions.reduce(
      (sum: number, t) => sum + Number(t.subtotal || t.total || 0),
      0
    );
    const totalDiscounts = transactions.reduce(
      (sum: number, t) => sum + Number(t.discountTotal || 0),
      0
    );

    return {
      total,
      grossTotal,
      totalDiscounts,
      discountsByCategory: discountsByCategory.map((d) => ({
        category: d.category,
        amount: Number(d._sum.discountTotal || 0),
        count: d._count,
      })),
      byMethod: Array.from(methodTotals.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      })),
      bySource: byCategory.map((c) => ({
        source: c.category as IncomeSource,
        amount: Number(c._sum.total || 0),
        count: c._count,
      })),
      byDay,
    };
  },

  // ----------------------
  // RECEIVABLES REPORT
  // ----------------------

  async getReceivables(
    filter: "all" | "overdue" | "pending" = "all"
  ): Promise<ReceivableItem[]> {
    // Get purchases with pending amounts
    const purchases = await prisma.packagePurchase.findMany({
      where: {
        isActive: true,
        paymentPlan: "INSTALLMENTS",
        paidAmount: { lt: prisma.packagePurchase.fields.finalPrice },
      },
      include: {
        baby: {
          include: {
            parents: {
              where: { isPrimary: true },
              include: { parent: true },
            },
          },
        },
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get installment transactions for these purchases to count paid installments
    const purchaseIds = purchases.map((p) => p.id);
    const installmentTransactions = await prisma.transaction.groupBy({
      by: ["referenceId"],
      where: {
        category: "PACKAGE_INSTALLMENT",
        referenceType: "PackagePurchase",
        referenceId: { in: purchaseIds },
        // Exclude voided transactions and reversals from aggregations
        voidedAt: null,
        isReversal: false,
      },
      _count: true,
    });

    // Create a map of purchaseId -> paid installments count
    const paidInstallmentsMap = new Map<string, number>();
    for (const t of installmentTransactions) {
      paidInstallmentsMap.set(t.referenceId, t._count);
    }

    const results = purchases.map((p) => {
      const totalPrice = Number(p.totalPrice || p.finalPrice);
      const paidAmount = Number(p.paidAmount);
      const pendingAmount = totalPrice - paidAmount;
      const paidInstallments = paidInstallmentsMap.get(p.id) || 0;
      const totalInstallments = p.installments;

      // Calculate if overdue using installments logic
      const purchaseForPayment: PackagePurchaseForPayment = {
        usedSessions: p.usedSessions,
        totalSessions: p.totalSessions,
        remainingSessions: p.remainingSessions,
        paymentPlan: p.paymentPlan,
        installments: p.installments,
        installmentAmount: p.installmentAmount,
        totalPrice: p.totalPrice,
        finalPrice: p.finalPrice,
        paidAmount: p.paidAmount,
        installmentsPayOnSessions: p.installmentsPayOnSessions,
      };

      const status = getPaymentStatus(purchaseForPayment);
      const isOverdue = status.overdueAmount > 0;

      return {
        id: p.id,
        babyId: p.babyId || "",
        babyName: p.baby?.name || "N/A",
        parentName: p.baby?.parents[0]?.parent.name || "N/A",
        parentPhone: p.baby?.parents[0]?.parent.phone || null,
        packageName: p.package.name,
        totalPrice,
        paidAmount,
        pendingAmount,
        installmentsPending: totalInstallments - paidInstallments,
        isOverdue,
        createdAt: p.createdAt,
      };
    });

    // Apply filter if specified
    if (filter === "overdue") {
      return results.filter((r) => r.isOverdue);
    } else if (filter === "pending") {
      return results.filter((r) => !r.isOverdue && r.pendingAmount > 0);
    }

    return results;
  },

  // ----------------------
  // ATTENDANCE REPORT
  // ----------------------

  async getAttendanceStats(from: Date, to: Date): Promise<AttendanceStats[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED"] },
      },
      select: {
        date: true,
        status: true,
      },
      orderBy: { date: "asc" },
    });

    // Agrupar por fecha
    const byDate = new Map<string, AttendanceStats>();

    for (const apt of appointments) {
      const dateKey = apt.date.toISOString().split("T")[0];
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date: dateKey,
          completed: 0,
          noShow: 0,
          cancelled: 0,
          total: 0,
        });
      }
      const stats = byDate.get(dateKey)!;
      stats.total++;
      if (apt.status === "COMPLETED") stats.completed++;
      else if (apt.status === "NO_SHOW") stats.noShow++;
      else if (apt.status === "CANCELLED") stats.cancelled++;
    }

    return Array.from(byDate.values());
  },

  async getNoShows(from: Date, to: Date): Promise<NoShowItem[]> {
    const noShows = await prisma.appointment.findMany({
      where: {
        date: { gte: from, lte: to },
        status: "NO_SHOW",
      },
      include: {
        baby: {
          include: {
            parents: {
              where: { isPrimary: true },
              include: { parent: true },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return noShows.map((apt) => ({
      id: apt.id,
      date: apt.date,
      startTime: apt.startTime,
      babyName: apt.baby?.name || "N/A",
      parentName: apt.baby?.parents[0]?.parent.name || "N/A",
      parentPhone: apt.baby?.parents[0]?.parent.phone || null,
    }));
  },

  // ----------------------
  // INVENTORY REPORT
  // ----------------------

  async getInventoryReport(
    filter: "all" | "low-stock" | "out-of-stock" = "all"
  ): Promise<InventoryItem[]> {
    const where: Prisma.ProductWhereInput = { isActive: true };

    // Para out-of-stock podemos filtrar directamente
    if (filter === "out-of-stock") {
      where.currentStock = 0;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        categoryRef: true,
        movements: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ currentStock: "asc" }, { name: "asc" }],
    });

    // Mapear y calcular status
    const mapped = products.map((p) => {
      let status: "ok" | "low" | "out" = "ok";
      if (p.currentStock === 0) status = "out";
      else if (p.currentStock <= p.minStock) status = "low";

      return {
        id: p.id,
        name: p.name,
        category: p.categoryRef?.name || null,
        currentStock: p.currentStock,
        minStock: p.minStock,
        costPrice: Number(p.costPrice),
        salePrice: Number(p.salePrice),
        status,
        lastMovementDate: p.movements[0]?.createdAt || null,
      };
    });

    // Aplicar filtro de low-stock en post-processing (ya que depende de minStock por producto)
    if (filter === "low-stock") {
      return mapped.filter((p) => p.status === "low");
    }

    return mapped;
  },

  // ----------------------
  // PENDING EVALUATIONS
  // ----------------------

  async getPendingEvaluations(limit: number = 50): Promise<PendingEvaluation[]> {
    const sessions = await prisma.session.findMany({
      where: {
        status: "COMPLETED",
        evaluation: null,
      },
      include: {
        appointment: true,
        baby: true,
        therapist: true,
      },
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    return sessions.map((s) => ({
      id: s.id,
      appointmentId: s.appointmentId,
      date: s.appointment.date,
      startTime: s.appointment.startTime,
      babyId: s.babyId || "",
      babyName: s.baby?.name || "N/A",
      therapistId: s.therapistId,
      therapistName: s.therapist.name,
      sessionNumber: s.sessionNumber,
      completedAt: s.completedAt,
    }));
  },
  // ----------------------
  // P&L REPORT (TIER 2)
  // ----------------------

  async getPnLReport(from: Date, to: Date): Promise<PnLReport> {
    const [
      incomeByCategory,
      productCosts,
      eventProductCosts,
      staffPayments,
      expenses,
    ] = await Promise.all([
      // All income by category using Transaction
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          type: "INCOME",
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        _sum: { total: true },
      }),
      // Direct costs: products used in sessions (need to multiply quantity * unitPrice)
      prisma.sessionProduct.findMany({
        where: {
          session: {
            completedAt: { gte: from, lte: to },
          },
        },
        select: { quantity: true, unitPrice: true },
      }),
      // Direct costs: products used in events (need to multiply quantity * unitPrice)
      prisma.eventProductUsage.findMany({
        where: {
          event: {
            date: { gte: from, lte: to },
            status: "COMPLETED",
          },
        },
        select: { quantity: true, unitPrice: true },
      }),
      // Staff payments (payroll)
      prisma.staffPayment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { netAmount: true },
      }),
      // Expenses by category
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          expenseDate: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
    ]);

    // Create a map for easy lookup of income by category
    const incomeByCategoryMap = new Map<TransactionCategory, number>();
    for (const item of incomeByCategory) {
      incomeByCategoryMap.set(item.category, Number(item._sum.total || 0));
    }

    // Calculate totals from category map
    // SESSION includes checkout payments, SESSION_PRODUCTS for products sold separately
    const incomeFromSessions = (incomeByCategoryMap.get("SESSION") || 0) +
                               (incomeByCategoryMap.get("SESSION_PRODUCTS") || 0);
    const incomeFromBabyCards = incomeByCategoryMap.get("BABY_CARD") || 0;
    // EVENT_REGISTRATION for event tickets, EVENT_PRODUCTS for products sold at events
    const incomeFromEvents = (incomeByCategoryMap.get("EVENT_REGISTRATION") || 0) +
                             (incomeByCategoryMap.get("EVENT_PRODUCTS") || 0);
    // PACKAGE_INSTALLMENT for installment payments, PACKAGE_SALE for upfront package sales
    const incomeFromInstallments = (incomeByCategoryMap.get("PACKAGE_INSTALLMENT") || 0) +
                                   (incomeByCategoryMap.get("PACKAGE_SALE") || 0);
    // Include advance payments in total income
    const incomeFromAdvances = incomeByCategoryMap.get("APPOINTMENT_ADVANCE") || 0;
    const totalIncome = incomeFromSessions + incomeFromBabyCards + incomeFromEvents + incomeFromInstallments + incomeFromAdvances;

    // Calculate product costs by multiplying quantity * unitPrice
    const sessionProductCosts = productCosts.reduce(
      (sum: number, p: { quantity: number; unitPrice: Prisma.Decimal }) => sum + p.quantity * Number(p.unitPrice),
      0
    );
    const eventProductsCosts = eventProductCosts.reduce(
      (sum: number, p: { quantity: number; unitPrice: Prisma.Decimal }) => sum + p.quantity * Number(p.unitPrice),
      0
    );
    const totalDirectCosts = sessionProductCosts + eventProductsCosts;

    const grossMargin = totalIncome - totalDirectCosts;

    const payrollCosts = Number(staffPayments._sum.netAmount || 0);
    const expensesByCategory = expenses.map((e) => ({
      category: e.category,
      amount: Number(e._sum.amount || 0),
    }));
    const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);
    const totalOperatingExpenses = payrollCosts + totalExpenses;

    const netResult = grossMargin - totalOperatingExpenses;
    const netMarginPercent = totalIncome > 0 ? (netResult / totalIncome) * 100 : 0;

    return {
      income: {
        sessions: incomeFromSessions,
        babyCards: incomeFromBabyCards,
        events: incomeFromEvents,
        installments: incomeFromInstallments,
        advances: incomeFromAdvances,
        total: totalIncome,
      },
      directCosts: {
        sessionProducts: sessionProductCosts,
        eventProducts: eventProductsCosts,
        total: totalDirectCosts,
      },
      grossMargin,
      operatingExpenses: {
        payroll: payrollCosts,
        byCategory: expensesByCategory,
        total: totalOperatingExpenses,
      },
      netResult,
      netMarginPercent,
    };
  },

  // ----------------------
  // THERAPIST PERFORMANCE (TIER 2)
  // ----------------------

  async getTherapistPerformance(from: Date, to: Date): Promise<TherapistPerformance[]> {
    const therapists = await prisma.user.findMany({
      where: {
        role: "THERAPIST",
        isActive: true,
      },
      include: {
        sessionsAsTherapist: {
          where: {
            completedAt: { gte: from, lte: to },
          },
          include: {
            evaluation: true,
            appointment: true,
          },
        },
      },
    });

    return therapists
      .map((t) => {
        const completedSessions = t.sessionsAsTherapist.length;
        const evaluatedSessions = t.sessionsAsTherapist.filter((s) => s.evaluation).length;
        const totalHours = completedSessions; // Each session = 1 hour approximately
        const evaluationRate = completedSessions > 0 ? (evaluatedSessions / completedSessions) * 100 : 0;

        return {
          id: t.id,
          name: t.name,
          completedSessions,
          totalHours,
          evaluatedSessions,
          evaluationRate,
        };
      })
      .sort((a, b) => b.completedSessions - a.completedSessions);
  },

  // ----------------------
  // CLIENT PORTFOLIO (TIER 2)
  // ----------------------

  async getClientPortfolio(): Promise<ClientPortfolio> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [totalBabies, activeBabies, newBabies, topClientsData, atRiskClients] = await Promise.all([
      // Total registered babies
      prisma.baby.count({ where: { isActive: true } }),
      // Active babies (with appointment in last 3 months)
      prisma.baby.count({
        where: {
          isActive: true,
          appointments: { some: { date: { gte: threeMonthsAgo } } },
        },
      }),
      // New babies this month
      prisma.baby.count({
        where: { createdAt: { gte: oneMonthAgo } },
      }),
      // Top clients - get all babies with their purchases, sessions, baby cards, and events
      prisma.baby.findMany({
        where: { isActive: true },
        include: {
          parents: { where: { isPrimary: true }, include: { parent: true } },
          packagePurchases: { where: { isActive: true } },
          sessions: {
            where: { status: "COMPLETED" },
            select: { id: true },
          },
          babyCardPurchases: {
            select: { pricePaid: true },
          },
          eventParticipations: {
            select: { amountPaid: true },
          },
        },
      }),
      // At risk clients (no visit in 45+ days)
      prisma.baby.findMany({
        where: {
          isActive: true,
          appointments: {
            none: {
              date: { gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
            },
          },
        },
        include: {
          parents: { where: { isPrimary: true }, include: { parent: true } },
          appointments: { orderBy: { date: "desc" }, take: 1 },
        },
        take: 20,
      }),
    ]);

    const inactiveBabies = totalBabies - activeBabies;

    // Calculate top clients by TOTAL spent (packages + baby cards + events)
    const topClientsFormatted = topClientsData
      .map((b) => {
        // Sum from package purchases
        const packageSpent = b.packagePurchases.reduce(
          (sum, p) => sum + Number(p.paidAmount),
          0
        );
        // Sum from baby card purchases
        const babyCardSpent = b.babyCardPurchases.reduce(
          (sum, bc) => sum + Number(bc.pricePaid),
          0
        );
        // Sum from event participation
        const eventSpent = b.eventParticipations.reduce(
          (sum, ep) => sum + Number(ep.amountPaid),
          0
        );

        return {
          babyId: b.id,
          babyName: b.name,
          parentName: b.parents[0]?.parent.name || "N/A",
          totalSpent: packageSpent + babyCardSpent + eventSpent,
          totalSessions: b.sessions.length,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Format at-risk clients
    const atRiskFormatted = atRiskClients.map((b) => ({
      babyId: b.id,
      babyName: b.name,
      parentName: b.parents[0]?.parent.name || "N/A",
      parentPhone: b.parents[0]?.parent.phone || null,
      lastVisit: b.appointments[0]?.date || null,
      reason: "inactive" as const,
    }));

    return {
      total: totalBabies,
      active: activeBabies,
      inactive: inactiveBabies,
      newThisMonth: newBabies,
      topClients: topClientsFormatted,
      atRisk: atRiskFormatted,
    };
  },

  // ----------------------
  // PACKAGES REPORT (TIER 2)
  // ----------------------

  async getPackagesReport(from: Date, to: Date): Promise<PackagesReport> {
    const [packageSales, allPurchases, discounts] = await Promise.all([
      // Sales by package
      prisma.packagePurchase.groupBy({
        by: ["packageId"],
        where: {
          createdAt: { gte: from, lte: to },
          isActive: true,
        },
        _count: true,
        _sum: { finalPrice: true },
      }),
      // All active purchases for utilization
      prisma.packagePurchase.findMany({
        where: { isActive: true },
        select: {
          totalSessions: true,
          usedSessions: true,
          updatedAt: true,
        },
      }),
      // Discounts given
      prisma.packagePurchase.aggregate({
        where: {
          createdAt: { gte: from, lte: to },
          discountAmount: { gt: 0 },
        },
        _sum: { discountAmount: true },
        _count: true,
      }),
    ]);

    // Get package names
    const packageIds = packageSales.map((p) => p.packageId);
    const packages = await prisma.package.findMany({
      where: { id: { in: packageIds } },
      select: { id: true, name: true },
    });

    const packageNameMap = Object.fromEntries(packages.map((p) => [p.id, p.name]));

    const sales = packageSales.map((p) => ({
      packageId: p.packageId,
      packageName: packageNameMap[p.packageId] || "Unknown",
      sold: p._count,
      revenue: Number(p._sum.finalPrice || 0),
    })).sort((a, b) => b.revenue - a.revenue);

    // Calculate utilization
    const totalSessionsSold = allPurchases.reduce((sum, p) => sum + p.totalSessions, 0);
    const totalSessionsUsed = allPurchases.reduce((sum, p) => sum + p.usedSessions, 0);
    const utilizationRate = totalSessionsSold > 0 ? (totalSessionsUsed / totalSessionsSold) * 100 : 0;

    // Dormant packages (no activity in 60+ days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const dormantCount = allPurchases.filter(
      (p) => p.usedSessions < p.totalSessions && p.updatedAt < sixtyDaysAgo
    ).length;

    return {
      sales,
      utilization: {
        totalSold: totalSessionsSold,
        totalUsed: totalSessionsUsed,
        rate: utilizationRate,
        dormantCount,
      },
      discounts: {
        totalAmount: Number(discounts._sum.discountAmount || 0),
        count: discounts._count,
      },
    };
  },

  // ----------------------
  // ACQUISITION REPORT (TIER 2)
  // ----------------------

  async getAcquisitionReport(from: Date, to: Date): Promise<AcquisitionReport> {
    const [newBabies, leads, convertedLeads] = await Promise.all([
      // New clients (babies) this period
      prisma.baby.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        include: {
          parents: { where: { isPrimary: true }, include: { parent: true } },
          packagePurchases: { take: 1, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Active leads
      prisma.parent.findMany({
        where: {
          status: "LEAD",
        },
        select: {
          id: true,
          name: true,
          phone: true,
          pregnancyWeeks: true,
          leadSource: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      // Converted leads (in period)
      prisma.parent.count({
        where: {
          status: "ACTIVE",
          convertedAt: { gte: from, lte: to },
        },
      }),
    ]);

    const newClientsFormatted = newBabies.map((b) => ({
      babyId: b.id,
      babyName: b.name,
      parentName: b.parents[0]?.parent.name || "N/A",
      registeredAt: b.createdAt,
      firstPackage: b.packagePurchases[0]?.packageId || null,
    }));

    return {
      newClients: {
        count: newBabies.length,
        list: newClientsFormatted,
      },
      leads: {
        total: leads.length,
        list: leads.map((l) => ({
          id: l.id,
          name: l.name,
          phone: l.phone,
          pregnancyWeeks: l.pregnancyWeeks,
          source: l.leadSource,
          createdAt: l.createdAt,
        })),
      },
      convertedLeads,
      conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
    };
  },

  // ----------------------
  // OCCUPANCY REPORT (TIER 2)
  // ----------------------

  async getOccupancyReport(from: Date, to: Date): Promise<OccupancyReport> {
    const [appointments, businessHours] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          date: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
        select: {
          date: true,
          startTime: true,
        },
      }),
      prisma.businessHours.findMany({
        where: { isOpen: true },
      }),
    ]);

    // Define time slots (based on business hours)
    const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:30", "15:30", "16:30"];

    // Count appointments by day of week and time slot
    // Use getUTCDay() to avoid timezone issues with dates stored at UTC midnight
    const occupancyMap = new Map<string, number>();
    for (const apt of appointments) {
      const dayOfWeek = apt.date.getUTCDay();
      const key = `${dayOfWeek}-${apt.startTime}`;
      occupancyMap.set(key, (occupancyMap.get(key) || 0) + 1);
    }

    // Calculate days in range for each day of week
    // Use UTC methods to avoid timezone issues
    const dayCount = new Map<number, number>();
    const current = new Date(from);
    while (current <= to) {
      const dow = current.getUTCDay();
      dayCount.set(dow, (dayCount.get(dow) || 0) + 1);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Build heatmap data
    const maxSlotsPerHour = 5; // Maximum appointments per slot
    const heatmapData: OccupancySlot[] = [];

    for (let day = 0; day <= 6; day++) {
      const isOpen = businessHours.some((bh) => bh.dayOfWeek === day);
      if (!isOpen) continue;

      const daysInPeriod = dayCount.get(day) || 1;
      const maxPossible = daysInPeriod * maxSlotsPerHour;

      for (const time of timeSlots) {
        const key = `${day}-${time}`;
        const count = occupancyMap.get(key) || 0;
        const rate = (count / maxPossible) * 100;

        heatmapData.push({
          dayOfWeek: day,
          time,
          appointments: count,
          maxCapacity: maxPossible,
          occupancyRate: rate,
          level: rate >= 80 ? "high" : rate >= 50 ? "medium" : "low",
        });
      }
    }

    // Calculate overall occupancy
    const totalAppointments = appointments.length;
    const totalSlots = heatmapData.reduce((sum, s) => sum + s.maxCapacity, 0);
    const overallRate = totalSlots > 0 ? (totalAppointments / totalSlots) * 100 : 0;

    // Calculate popular times (aggregate by time slot)
    const timeCountMap = new Map<string, number>();
    for (const apt of appointments) {
      timeCountMap.set(apt.startTime, (timeCountMap.get(apt.startTime) || 0) + 1);
    }
    const popularTimes = Array.from(timeCountMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate popular days (aggregate by day of week)
    const dayCountMap = new Map<number, number>();
    for (const apt of appointments) {
      const dow = apt.date.getUTCDay();
      dayCountMap.set(dow, (dayCountMap.get(dow) || 0) + 1);
    }
    const popularDays = Array.from(dayCountMap.entries())
      .map(([dayOfWeek, count]) => ({ dayOfWeek, count }))
      .sort((a, b) => b.count - a.count);

    return {
      heatmap: heatmapData,
      overall: {
        totalAppointments,
        totalSlots,
        occupancyRate: overallRate,
      },
      popularTimes,
      popularDays,
    };
  },

  // ----------------------
  // BABY CARDS REPORT (TIER 3)
  // ----------------------

  async getBabyCardsReport(from: Date, to: Date): Promise<BabyCardsReport> {
    const [purchases, allPurchases, rewardUsages] = await Promise.all([
      // Purchases in period
      prisma.babyCardPurchase.findMany({
        where: {
          purchaseDate: { gte: from, lte: to },
        },
        include: {
          babyCard: true,
          baby: true,
        },
      }),
      // All active purchases for progress
      prisma.babyCardPurchase.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          babyCard: true,
          baby: true,
          rewardUsages: true,
        },
      }),
      // Reward usages in period
      prisma.babyCardRewardUsage.findMany({
        where: {
          usedAt: { gte: from, lte: to },
        },
        include: {
          babyCardReward: true,
        },
      }),
    ]);

    const soldInPeriod = purchases.length;
    const revenueInPeriod = purchases.reduce((sum, p) => sum + Number(p.pricePaid), 0);
    const activeCards = allPurchases.filter((p) => p.status === "ACTIVE").length;
    const completedCards = allPurchases.filter((p) => p.status === "COMPLETED").length;

    // Calculate average progress
    const totalProgress = allPurchases.reduce((sum, p) => {
      const total = p.babyCard.totalSessions;
      const completed = p.completedSessions;
      return sum + (total > 0 ? (completed / total) * 100 : 0);
    }, 0);
    const avgProgress = allPurchases.length > 0 ? totalProgress / allPurchases.length : 0;

    // Progress by card
    const progressList = allPurchases
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({
        babyId: p.babyId,
        babyName: p.baby.name,
        cardName: p.babyCard.name,
        completedSessions: p.completedSessions,
        totalSessions: p.babyCard.totalSessions,
        progressPercent: (p.completedSessions / p.babyCard.totalSessions) * 100,
        lastActivity: p.updatedAt,
      }))
      .sort((a, b) => b.progressPercent - a.progressPercent);

    // Rewards stats
    const rewardsUnlocked = rewardUsages.length;
    const rewardsDelivered = rewardUsages.filter((r) => r.usedAt).length;

    return {
      summary: {
        soldInPeriod,
        revenueInPeriod,
        activeCards,
        completedCards,
      },
      progress: {
        averageProgress: avgProgress,
        list: progressList.slice(0, 10),
      },
      rewards: {
        unlocked: rewardsUnlocked,
        delivered: rewardsDelivered,
        deliveryRate: rewardsUnlocked > 0 ? (rewardsDelivered / rewardsUnlocked) * 100 : 0,
      },
    };
  },

  // ----------------------
  // EVENTS REPORT (TIER 3)
  // ----------------------

  async getEventsReport(from: Date, to: Date): Promise<EventsReport> {
    const events = await prisma.event.findMany({
      where: {
        date: { gte: from, lte: to },
      },
      include: {
        participants: {
          include: {
            baby: true,
            parent: true,
          },
        },
        productUsages: true,
      },
      orderBy: { date: "desc" },
    });

    const completedEvents = events.filter((e) => e.status === "COMPLETED");
    const totalParticipants = completedEvents.reduce((sum, e) => sum + e.participants.length, 0);
    const totalRevenue = completedEvents.reduce(
      (sum, e) => sum + e.participants.reduce((pSum, p) => pSum + Number(p.amountPaid), 0),
      0
    );

    // Attendance rate
    const confirmedParticipants = completedEvents.reduce(
      (sum, e) => sum + e.participants.filter((p) => p.status === "CONFIRMED").length,
      0
    );
    const attendedParticipants = completedEvents.reduce(
      (sum, e) => sum + e.participants.filter((p) => p.attended === true).length,
      0
    );
    const attendanceRate = confirmedParticipants > 0 ? (attendedParticipants / confirmedParticipants) * 100 : 0;

    // Events list
    const eventsList = completedEvents.map((e) => {
      const participants = e.participants.length;
      const revenue = e.participants.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const productCosts = e.productUsages.reduce((sum, u) => sum + Number(u.unitPrice) * u.quantity, 0);
      const margin = revenue > 0 ? ((revenue - productCosts) / revenue) * 100 : 0;
      const attended = e.participants.filter((p) => p.attended === true).length;

      return {
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date,
        participants,
        attended,
        revenue,
        margin,
      };
    });

    // Conversion for PARENTS events (leads to clients)
    const parentEvents = completedEvents.filter((e) => e.type === "PARENTS");
    const leadParticipants = parentEvents.reduce((sum, e) => sum + e.participants.length, 0);

    return {
      summary: {
        totalEvents: completedEvents.length,
        totalParticipants,
        totalRevenue,
        attendanceRate,
      },
      events: eventsList,
      conversion: {
        leadParticipants,
        converted: 0, // Would need more complex tracking
        conversionRate: 0,
      },
    };
  },

  // ----------------------
  // PAYROLL REPORT (TIER 3)
  // ----------------------

  async getPayrollReport(from: Date, to: Date): Promise<PayrollReport> {
    const [payments, advances, _staffList] = await Promise.all([
      // Paid payments in period
      prisma.staffPayment.findMany({
        where: {
          paidAt: { gte: from, lte: to },
          status: "PAID",
          deletedAt: null,
        },
        include: {
          staff: true,
        },
      }),
      // Current advance balances
      prisma.staffAdvanceBalance.findMany({
        where: {
          currentBalance: { gt: 0 },
        },
        include: {
          staff: true,
        },
      }),
      // Active staff
      prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ["THERAPIST", "RECEPTION", "ADMIN"] },
        },
        select: {
          id: true,
          name: true,
          role: true,
          baseSalary: true,
        },
      }),
    ]);

    // Group by type
    const byType = new Map<string, number>();
    for (const p of payments) {
      const type = p.type;
      byType.set(type, (byType.get(type) || 0) + Number(p.netAmount));
    }

    const salaries = byType.get("SALARY") || 0;
    const commissions = byType.get("COMMISSION") || 0;
    const bonuses = byType.get("BONUS") || 0;
    const benefits = byType.get("BENEFIT") || 0;
    const deductions = byType.get("DEDUCTION") || 0;
    const advancePayments = byType.get("ADVANCE") || 0;
    const advanceReturns = byType.get("ADVANCE_RETURN") || 0;

    const totalPayroll = salaries + commissions + bonuses + benefits - deductions + advancePayments - advanceReturns;

    // By employee
    const byEmployee = new Map<string, { name: string; total: number }>();
    for (const p of payments) {
      const key = p.staffId;
      const current = byEmployee.get(key) || { name: p.staff.name, total: 0 };
      current.total += Number(p.netAmount);
      byEmployee.set(key, current);
    }

    const employeeList = Array.from(byEmployee.values())
      .sort((a, b) => b.total - a.total);

    // Pending advances
    const pendingAdvances = advances.map((a) => ({
      staffId: a.staffId,
      staffName: a.staff.name,
      balance: Number(a.currentBalance),
    }));

    const totalPendingAdvances = pendingAdvances.reduce((sum, a) => sum + a.balance, 0);

    return {
      summary: {
        totalPayroll,
        salaries,
        commissions,
        bonuses,
        benefits,
        deductions,
      },
      byEmployee: employeeList,
      advances: {
        pending: pendingAdvances,
        totalPending: totalPendingAdvances,
      },
    };
  },

  // ----------------------
  // CASHFLOW REPORT (TIER 3)
  // ----------------------

  async getCashflowReport(from: Date, to: Date): Promise<CashflowReport> {
    const [
      incomeByCategory,
      allTransactions,
      staffPayments,
      expenses,
      futureAppointments,
      pendingInstallments,
    ] = await Promise.all([
      // All income by category using Transaction
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          type: "INCOME",
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        _sum: { total: true },
      }),
      // All transactions for payment method breakdown
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          // Exclude voided transactions and reversals from aggregations
          voidedAt: null,
          isReversal: false,
        },
        select: { type: true, paymentMethods: true },
      }),
      // Staff payments
      prisma.staffPayment.aggregate({
        where: {
          paidAt: { gte: from, lte: to },
          status: "PAID",
          deletedAt: null,
        },
        _sum: { netAmount: true },
      }),
      // Expenses
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: from, lte: to },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      // Future appointments (next 30 days) for projection
      prisma.appointment.count({
        where: {
          date: { gte: to, lte: new Date(to.getTime() + 30 * 24 * 60 * 60 * 1000) },
          status: { in: ["SCHEDULED", "PENDING_PAYMENT"] },
        },
      }),
      // Pending installments for projection
      prisma.packagePurchase.aggregate({
        where: {
          isActive: true,
          paymentPlan: "INSTALLMENTS",
          paidAmount: { lt: prisma.packagePurchase.fields.finalPrice },
        },
        _sum: { finalPrice: true, paidAmount: true },
      }),
    ]);

    // Create a map for easy lookup of income by category
    const incomeByCategoryMap = new Map<TransactionCategory, number>();
    for (const item of incomeByCategory) {
      incomeByCategoryMap.set(item.category, Number(item._sum.total || 0));
    }

    // Calculate totals
    const incomeFromSessions = (incomeByCategoryMap.get("SESSION") || 0) +
                               (incomeByCategoryMap.get("SESSION_PRODUCTS") || 0);
    const incomeFromBabyCards = incomeByCategoryMap.get("BABY_CARD") || 0;
    const incomeFromEvents = (incomeByCategoryMap.get("EVENT_REGISTRATION") || 0) +
                             (incomeByCategoryMap.get("EVENT_PRODUCTS") || 0);
    const incomeFromInstallments = (incomeByCategoryMap.get("PACKAGE_INSTALLMENT") || 0) +
                                   (incomeByCategoryMap.get("PACKAGE_SALE") || 0) +
                                   (incomeByCategoryMap.get("APPOINTMENT_ADVANCE") || 0);
    const totalIncome = incomeFromSessions + incomeFromBabyCards + incomeFromEvents + incomeFromInstallments;

    const payrollExpenses = Number(staffPayments._sum.netAmount || 0);
    const operatingExpenses = Number(expenses._sum.amount || 0);
    const totalExpenses = payrollExpenses + operatingExpenses;

    const netCashflow = totalIncome - totalExpenses;

    // Payment method breakdown from Transaction.paymentMethods JSON
    const byMethod: Record<string, { income: number; expense: number }> = {};
    for (const t of allTransactions) {
      const methods = Array.isArray(t.paymentMethods) ? t.paymentMethods as { method: string; amount: number }[] : [];
      for (const m of methods) {
        if (!byMethod[m.method]) byMethod[m.method] = { income: 0, expense: 0 };
        if (t.type === "INCOME") byMethod[m.method].income += Number(m.amount);
        else byMethod[m.method].expense += Number(m.amount);
      }
    }
    const methodOrder = ["CASH", "QR", "TRANSFER", "CARD"];
    const paymentMethodBreakdown = methodOrder
      .filter(method => byMethod[method])
      .map(method => ({
        method,
        income: byMethod[method].income,
        expense: byMethod[method].expense,
        net: byMethod[method].income - byMethod[method].expense,
      }));

    // Projection
    const avgSessionPrice = 350; // Approximate average
    const projectedFromAppointments = futureAppointments * avgSessionPrice;
    const pendingFromInstallments =
      Number(pendingInstallments._sum.finalPrice || 0) - Number(pendingInstallments._sum.paidAmount || 0);

    return {
      period: {
        from,
        to,
      },
      income: {
        sessions: incomeFromSessions,
        babyCards: incomeFromBabyCards,
        events: incomeFromEvents,
        installments: incomeFromInstallments,
        total: totalIncome,
      },
      expenses: {
        payroll: payrollExpenses,
        operating: operatingExpenses,
        total: totalExpenses,
      },
      netCashflow,
      byPaymentMethod: paymentMethodBreakdown,
      projection: {
        upcomingAppointments: futureAppointments,
        estimatedFromAppointments: projectedFromAppointments,
        pendingInstallments: pendingFromInstallments,
      },
    };
  },
};

// ============================================================
// TIER 2 TYPES
// ============================================================

interface PnLReport {
  income: {
    sessions: number;
    babyCards: number;
    events: number;
    installments: number;
    advances: number;
    total: number;
  };
  directCosts: {
    sessionProducts: number;
    eventProducts: number;
    total: number;
  };
  grossMargin: number;
  operatingExpenses: {
    payroll: number;
    byCategory: { category: string; amount: number }[];
    total: number;
  };
  netResult: number;
  netMarginPercent: number;
}

interface TherapistPerformance {
  id: string;
  name: string;
  completedSessions: number;
  totalHours: number;
  evaluatedSessions: number;
  evaluationRate: number;
}

interface ClientPortfolio {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  topClients: {
    babyId: string;
    babyName: string;
    parentName: string;
    totalSpent: number;
    totalSessions: number;
  }[];
  atRisk: {
    babyId: string;
    babyName: string;
    parentName: string;
    parentPhone: string | null;
    lastVisit: Date | null;
    reason: "inactive" | "no_show" | "aging_out";
  }[];
}

interface PackagesReport {
  sales: {
    packageId: string;
    packageName: string;
    sold: number;
    revenue: number;
  }[];
  utilization: {
    totalSold: number;
    totalUsed: number;
    rate: number;
    dormantCount: number;
  };
  discounts: {
    totalAmount: number;
    count: number;
  };
}

interface AcquisitionReport {
  newClients: {
    count: number;
    list: {
      babyId: string;
      babyName: string;
      parentName: string;
      registeredAt: Date;
      firstPackage: string | null;
    }[];
  };
  leads: {
    total: number;
    list: {
      id: string;
      name: string;
      phone: string | null;
      pregnancyWeeks: number | null;
      source: string | null;
      createdAt: Date;
    }[];
  };
  convertedLeads: number;
  conversionRate: number;
}

interface OccupancySlot {
  dayOfWeek: number;
  time: string;
  appointments: number;
  maxCapacity: number;
  occupancyRate: number;
  level: "high" | "medium" | "low";
}

interface OccupancyReport {
  heatmap: OccupancySlot[];
  overall: {
    totalAppointments: number;
    totalSlots: number;
    occupancyRate: number;
  };
  popularTimes: { time: string; count: number }[];
  popularDays: { dayOfWeek: number; count: number }[];
}

// ============================================================
// TIER 3 TYPES
// ============================================================

interface BabyCardsReport {
  summary: {
    soldInPeriod: number;
    revenueInPeriod: number;
    activeCards: number;
    completedCards: number;
  };
  progress: {
    averageProgress: number;
    list: {
      babyId: string;
      babyName: string;
      cardName: string;
      completedSessions: number;
      totalSessions: number;
      progressPercent: number;
      lastActivity: Date;
    }[];
  };
  rewards: {
    unlocked: number;
    delivered: number;
    deliveryRate: number;
  };
}

interface EventsReport {
  summary: {
    totalEvents: number;
    totalParticipants: number;
    totalRevenue: number;
    attendanceRate: number;
  };
  events: {
    id: string;
    name: string;
    type: string;
    date: Date;
    participants: number;
    attended: number;
    revenue: number;
    margin: number;
  }[];
  conversion: {
    leadParticipants: number;
    converted: number;
    conversionRate: number;
  };
}

interface PayrollReport {
  summary: {
    totalPayroll: number;
    salaries: number;
    commissions: number;
    bonuses: number;
    benefits: number;
    deductions: number;
  };
  byEmployee: {
    name: string;
    total: number;
  }[];
  advances: {
    pending: {
      staffId: string;
      staffName: string;
      balance: number;
    }[];
    totalPending: number;
  };
}

interface CashflowReport {
  period: {
    from: Date;
    to: Date;
  };
  income: {
    sessions: number;
    babyCards: number;
    events: number;
    installments: number;
    total: number;
  };
  expenses: {
    payroll: number;
    operating: number;
    total: number;
  };
  netCashflow: number;
  byPaymentMethod: {
    method: string;
    income: number;
    expense: number;
    net: number;
  }[];
  projection: {
    upcomingAppointments: number;
    estimatedFromAppointments: number;
    pendingInstallments: number;
  };
}

// Export types
export type {
  DashboardKPIs,
  IncomeReport,
  IncomeByDay,
  ReceivableItem,
  AttendanceStats,
  NoShowItem,
  InventoryItem,
  PendingEvaluation,
  PnLReport,
  TherapistPerformance,
  ClientPortfolio,
  PackagesReport,
  AcquisitionReport,
  OccupancySlot,
  OccupancyReport,
  BabyCardsReport,
  EventsReport,
  PayrollReport,
  CashflowReport,
};
