import { prisma } from "@/lib/db";
import {
  TransactionType,
  TransactionCategory,
  ItemType,
  PaymentMethod,
  Prisma,
} from "@prisma/client";

// Use Prisma.Decimal for proper typing
type Decimal = Prisma.Decimal;

// ============================================================
// TYPES
// ============================================================

export interface PaymentMethodEntry {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface TransactionItemInput {
  itemType: ItemType;
  referenceId?: string;
  description: string;
  quantity?: number;
  unitPrice: number;
  discountAmount?: number;
  discountReason?: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  category: TransactionCategory;
  referenceType: string;
  referenceId: string;
  items: TransactionItemInput[];
  paymentMethods: PaymentMethodEntry[];
  notes?: string;
  createdById?: string;
  cashRegisterId?: string;
}

export interface TransactionWithItems {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  referenceType: string;
  referenceId: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  total: Decimal;
  paymentMethods: PaymentMethodEntry[];
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  isReversal: boolean;
  voidedAt: Date | null;
  items: {
    id: string;
    itemType: ItemType;
    referenceId: string | null;
    description: string;
    quantity: number;
    unitPrice: Decimal;
    discountAmount: Decimal;
    discountReason: string | null;
    finalPrice: Decimal;
  }[];
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validates that payment methods sum equals the total amount
 */
export function validatePaymentMethods(
  paymentMethods: PaymentMethodEntry[],
  total: number,
  tolerance = 0.01
): boolean {
  const sum = paymentMethods.reduce((acc, pm) => acc + pm.amount, 0);
  return Math.abs(sum - total) <= tolerance;
}

/**
 * Normalizes payment input - supports both single method and split payments
 */
export function normalizePaymentMethods(
  input:
    | PaymentMethodEntry[]
    | { paymentMethod: PaymentMethod; amount: number; reference?: string }
): PaymentMethodEntry[] {
  if (Array.isArray(input)) {
    return input;
  }
  // Legacy single payment format
  return [
    {
      method: input.paymentMethod,
      amount: input.amount,
      reference: input.reference,
    },
  ];
}

// ============================================================
// CREATE
// ============================================================

/**
 * Creates a transaction with its line items.
 * Accepts an optional Prisma transaction client for atomicity.
 *
 * @param input - Transaction data including items and payment methods
 * @param tx - Optional Prisma transaction client to run within an existing transaction
 */
export async function create(
  input: CreateTransactionInput,
  tx?: Prisma.TransactionClient
): Promise<TransactionWithItems> {
  const db = tx || prisma;

  // Calculate totals from items
  let subtotal = 0;
  let discountTotal = 0;

  const itemsWithFinalPrice = input.items.map((item) => {
    const qty = item.quantity ?? 1;
    const itemSubtotal = item.unitPrice * qty;
    const discount = item.discountAmount ?? 0;
    const finalPrice = itemSubtotal - discount;

    subtotal += itemSubtotal;
    discountTotal += discount;

    return {
      itemType: item.itemType,
      referenceId: item.referenceId,
      description: item.description,
      quantity: qty,
      unitPrice: item.unitPrice,
      discountAmount: discount,
      discountReason: item.discountReason,
      finalPrice,
    };
  });

  const total = subtotal - discountTotal;

  // Validate payment methods
  if (!validatePaymentMethods(input.paymentMethods, total)) {
    const paymentSum = input.paymentMethods.reduce(
      (acc, pm) => acc + pm.amount,
      0
    );
    throw new Error(
      `Payment methods sum (${paymentSum}) does not match total (${total})`
    );
  }

  const transaction = await db.transaction.create({
    data: {
      type: input.type,
      category: input.category,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      subtotal,
      discountTotal,
      total,
      paymentMethods: input.paymentMethods as unknown as object,
      notes: input.notes,
      createdById: input.createdById,
      ...(input.cashRegisterId
        ? { cashRegister: { connect: { id: input.cashRegisterId } } }
        : {}),
      items: {
        create: itemsWithFinalPrice,
      },
    },
    include: {
      items: true,
    },
  });

  return {
    ...transaction,
    items: transaction.items,
    paymentMethods: transaction.paymentMethods as unknown as PaymentMethodEntry[],
  };
}

// ============================================================
// READ
// ============================================================

/**
 * Gets a transaction by ID with all items
 */
export async function getById(
  id: string
): Promise<TransactionWithItems | null> {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!transaction) return null;

  return {
    ...transaction,
    paymentMethods: transaction.paymentMethods as unknown as PaymentMethodEntry[],
  };
}

/**
 * Gets transactions by reference (e.g., all payments for a session)
 */
export async function getByReference(
  referenceType: string,
  referenceId: string
): Promise<TransactionWithItems[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      referenceType,
      referenceId,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((t): TransactionWithItems => ({
    ...t,
    paymentMethods: t.paymentMethods as unknown as PaymentMethodEntry[],
  }));
}

/**
 * Gets all transactions for a category in a date range
 */
export async function getByCategory(
  category: TransactionCategory,
  from: Date,
  to: Date
): Promise<TransactionWithItems[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      category,
      createdAt: { gte: from, lte: to },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((t): TransactionWithItems => ({
    ...t,
    paymentMethods: t.paymentMethods as unknown as PaymentMethodEntry[],
  }));
}

/**
 * Gets all transactions of a type in a date range
 */
export async function getByType(
  type: TransactionType,
  from: Date,
  to: Date
): Promise<TransactionWithItems[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      type,
      createdAt: { gte: from, lte: to },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((t): TransactionWithItems => ({
    ...t,
    paymentMethods: t.paymentMethods as unknown as PaymentMethodEntry[],
  }));
}

// ============================================================
// AGGREGATIONS (for reports)
// ============================================================

/**
 * Gets total income by category for a date range
 */
export async function getTotalByCategory(
  from: Date,
  to: Date
): Promise<Record<TransactionCategory, number>> {
  const result = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      type: "INCOME",
      createdAt: { gte: from, lte: to },
      // Exclude voided transactions and reversals from aggregations
      voidedAt: null,
      isReversal: false,
    },
    _sum: { total: true },
  });

  const totals: Partial<Record<TransactionCategory, number>> = {};
  for (const r of result) {
    totals[r.category] = Number(r._sum.total) || 0;
  }

  // Return with all categories (default 0)
  return Object.values(TransactionCategory).reduce(
    (acc, cat) => {
      acc[cat] = totals[cat] || 0;
      return acc;
    },
    {} as Record<TransactionCategory, number>
  );
}

/**
 * Gets total income/expense for a date range
 */
export async function getTotals(
  from: Date,
  to: Date
): Promise<{ income: number; expense: number }> {
  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      createdAt: { gte: from, lte: to },
      // Exclude voided transactions and reversals from aggregations
      voidedAt: null,
      isReversal: false,
    },
    _sum: { total: true },
  });

  let income = 0;
  let expense = 0;

  for (const r of result) {
    if (r.type === "INCOME") {
      income = Number(r._sum.total) || 0;
    } else {
      expense = Number(r._sum.total) || 0;
    }
  }

  return { income, expense };
}

/**
 * Gets totals grouped by payment method for a date range
 */
export async function getTotalsByPaymentMethod(
  from: Date,
  to: Date
): Promise<Record<PaymentMethod, number>> {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: "INCOME",
      createdAt: { gte: from, lte: to },
      // Exclude voided transactions and reversals from aggregations
      voidedAt: null,
      isReversal: false,
    },
    select: { paymentMethods: true },
  });

  const totals: Record<PaymentMethod, number> = {
    CASH: 0,
    QR: 0,
    CARD: 0,
    TRANSFER: 0,
  };

  for (const t of transactions) {
    const methods = t.paymentMethods as unknown as PaymentMethodEntry[];
    for (const pm of methods) {
      totals[pm.method] += pm.amount;
    }
  }

  return totals;
}

/**
 * Gets total income from items by item type (for P&L breakdown)
 */
export async function getIncomeByItemType(
  from: Date,
  to: Date
): Promise<Record<ItemType, number>> {
  const result = await prisma.transactionItem.groupBy({
    by: ["itemType"],
    where: {
      transaction: {
        type: "INCOME",
        createdAt: { gte: from, lte: to },
        // Exclude voided transactions and reversals from aggregations
        voidedAt: null,
        isReversal: false,
      },
    },
    _sum: { finalPrice: true },
  });

  const totals: Partial<Record<ItemType, number>> = {};
  for (const r of result) {
    totals[r.itemType] = Number(r._sum.finalPrice) || 0;
  }

  // Return with all types (default 0)
  return Object.values(ItemType).reduce(
    (acc, type) => {
      acc[type] = totals[type] || 0;
      return acc;
    },
    {} as Record<ItemType, number>
  );
}

/**
 * Gets total discounts for a date range
 */
export async function getTotalDiscounts(
  from: Date,
  to: Date
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: {
      type: "INCOME",
      createdAt: { gte: from, lte: to },
      // Exclude voided transactions and reversals from aggregations
      voidedAt: null,
      isReversal: false,
    },
    _sum: { discountTotal: true },
  });

  return Number(result._sum.discountTotal) || 0;
}

// ============================================================
// VOID / REVERSAL
// ============================================================

/**
 * Voids a transaction by creating a reversal entry with negative amounts.
 * Marks the original with void metadata (for UI display only).
 * Does NOT apply side effects - those are handled by the caller.
 *
 * @param id - Transaction ID to void
 * @param reason - Required reason for voiding
 * @param voidedById - User ID performing the void
 * @param tx - Optional Prisma transaction client for atomicity
 */
export async function voidTransaction(
  id: string,
  reason: string,
  voidedById: string,
  tx?: Prisma.TransactionClient
): Promise<{ original: TransactionWithItems; reversal: TransactionWithItems }> {
  const db = tx || prisma;

  // 1. Load the original transaction
  const original = await db.transaction.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!original) throw new Error("TRANSACTION_NOT_FOUND");
  if (original.voidedAt) throw new Error("TRANSACTION_ALREADY_VOIDED");
  if (original.isReversal) throw new Error("CANNOT_VOID_REVERSAL");

  // 2. Create reversal Transaction (mirror with negative amounts)
  const originalPaymentMethods =
    original.paymentMethods as unknown as PaymentMethodEntry[];
  const reversedPaymentMethods = originalPaymentMethods.map((pm) => ({
    ...pm,
    amount: -pm.amount,
  }));

  const reversal = await db.transaction.create({
    data: {
      type: original.type,
      category: original.category,
      referenceType: original.referenceType,
      referenceId: original.referenceId,
      subtotal: -Number(original.subtotal),
      discountTotal: -Number(original.discountTotal),
      total: -Number(original.total),
      paymentMethods: reversedPaymentMethods as unknown as object,
      notes: `REVERSAL: ${reason}`,
      createdById: voidedById,
      isReversal: true,
      reversalOfId: original.id,
      items: {
        create: original.items.map((item) => ({
          itemType: item.itemType,
          referenceId: item.referenceId,
          description: `[REVERSAL] ${item.description}`,
          quantity: item.quantity,
          unitPrice: -Number(item.unitPrice),
          discountAmount: -Number(item.discountAmount),
          finalPrice: -Number(item.finalPrice),
        })),
      },
    },
    include: { items: true },
  });

  // 3. Mark void metadata on the original (UI-only)
  const updated = await db.transaction.update({
    where: { id },
    data: {
      voidedAt: new Date(),
      voidedById,
      voidReason: reason,
    },
    include: { items: true },
  });

  return {
    original: {
      ...updated,
      paymentMethods:
        updated.paymentMethods as unknown as PaymentMethodEntry[],
    },
    reversal: {
      ...reversal,
      paymentMethods:
        reversal.paymentMethods as unknown as PaymentMethodEntry[],
    },
  };
}

// ============================================================
// EXPORTS
// ============================================================

export const transactionService = {
  create,
  getById,
  getByReference,
  getByCategory,
  getByType,
  getTotalByCategory,
  getTotals,
  getTotalsByPaymentMethod,
  getIncomeByItemType,
  getTotalDiscounts,
  validatePaymentMethods,
  normalizePaymentMethods,
  voidTransaction,
};
