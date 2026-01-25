import { Prisma } from "@prisma/client";

/**
 * Installment calculation utilities for package financing
 *
 * New system:
 * - Installments are configured PER PACKAGE (not client choice)
 * - Installment price can be DIFFERENT (higher) than single payment
 * - Define ON WHICH SESSIONS each installment is due
 * - System ALERTS but does NOT BLOCK if payments are pending
 * - Payments are FLEXIBLE (any amount)
 */

// ============================================================
// TYPES
// ============================================================

export interface PackagePurchaseForPayment {
  usedSessions: number;
  totalSessions: number;
  remainingSessions: number;
  paymentPlan: string;
  installments: number;
  // Accept string for JSON-serialized Prisma.Decimal values
  installmentAmount: Prisma.Decimal | number | string | null;
  totalPrice: Prisma.Decimal | number | string | null;
  finalPrice: Prisma.Decimal | number | string;
  paidAmount: Prisma.Decimal | number | string;
  installmentsPayOnSessions?: string | null;
}

export interface PaymentStatus {
  isUpToDate: boolean;
  isPaidInFull: boolean;
  expectedAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  nextPaymentSession: number | null;
  nextPaymentAmount: number;
  message: string | null;
  overdueInstallments: number[];
}

export interface InstallmentDetail {
  number: number;
  amount: number;
  payOnSession: number | null;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  paidAmount: number;
  paidAt: Date | null;
}

export interface CanUseSessionResult {
  allowed: boolean;
  hasWarning: boolean;
  warningMessage: string | null;
  overdueAmount: number;
  paymentStatus: PaymentStatus;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Parsea el string de sesiones de pago a array de números
 * @param payOnSessions - String como "1,3,5" o "[1,3,5]"
 * @returns Array de números [1, 3, 5]
 */
export function parsePayOnSessions(payOnSessions: string | null | undefined): number[] {
  if (!payOnSessions) return [];

  // Limpiar el string (remover corchetes, espacios)
  const cleaned = payOnSessions.replace(/[\[\]\s]/g, '');
  if (!cleaned) return [];

  return cleaned.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
}

/**
 * Convierte Decimal, string o number a number
 * Handles: Prisma.Decimal objects, JSON-serialized decimals (strings), and numbers
 */
function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Prisma.Decimal object
  if (typeof value.toNumber === 'function') return value.toNumber();
  // Fallback for any other object type
  return Number(value) || 0;
}

/**
 * Calcula el monto por cuota
 */
export function calculateInstallmentAmount(totalPrice: number, installmentsCount: number): number {
  if (installmentsCount <= 0) return totalPrice;
  return Math.round((totalPrice / installmentsCount) * 100) / 100;
}

/**
 * Determina cuánto debería haber pagado el cliente según la sesión actual
 * @param currentSession - Sesión que va a usar (1-based)
 * @param payOnSessions - Array de sesiones donde se paga [1, 3, 5]
 * @param installmentAmount - Monto por cuota
 * @returns Monto que debería tener pagado
 */
export function getExpectedPaidAmount(
  currentSession: number,
  payOnSessions: number[],
  installmentAmount: number
): number {
  if (payOnSessions.length === 0) return 0;

  // Contar cuántas cuotas deberían estar pagadas
  const installmentsDue = payOnSessions.filter(session => session <= currentSession).length;

  return installmentsDue * installmentAmount;
}

/**
 * Obtiene el estado de pago de un paquete comprado
 */
export function getPaymentStatus(purchase: PackagePurchaseForPayment): PaymentStatus {
  const paidAmount = toNumber(purchase.paidAmount);
  // totalPrice puede ser null para compras antiguas, usar finalPrice como fallback
  const totalPrice = toNumber(purchase.totalPrice) || toNumber(purchase.finalPrice);
  const pendingAmount = Math.max(0, totalPrice - paidAmount);
  const isPaidInFull = paidAmount >= totalPrice;

  // Si es pago único o ya está pagado completo
  if (purchase.paymentPlan === 'SINGLE' || purchase.installments <= 1 || isPaidInFull) {
    return {
      isUpToDate: isPaidInFull || purchase.paymentPlan === 'SINGLE',
      isPaidInFull,
      expectedAmount: totalPrice,
      paidAmount,
      pendingAmount,
      overdueAmount: 0,
      nextPaymentSession: null,
      nextPaymentAmount: pendingAmount,
      message: null,
      overdueInstallments: []
    };
  }

  const installmentAmount = toNumber(purchase.installmentAmount) ||
    calculateInstallmentAmount(totalPrice, purchase.installments);

  const payOnSessions = parsePayOnSessions(purchase.installmentsPayOnSessions);
  const currentSession = purchase.usedSessions + 1;

  // Calcular cuánto debería haber pagado
  const expectedAmount = getExpectedPaidAmount(currentSession, payOnSessions, installmentAmount);
  const overdueAmount = Math.max(0, expectedAmount - paidAmount);
  const isUpToDate = overdueAmount === 0;

  // Identificar cuotas atrasadas
  const overdueInstallments: number[] = [];
  let accumulatedExpected = 0;

  for (let i = 0; i < payOnSessions.length; i++) {
    if (payOnSessions[i] <= currentSession) {
      accumulatedExpected += installmentAmount;
      if (paidAmount < accumulatedExpected) {
        overdueInstallments.push(i + 1); // Número de cuota (1-based)
      }
    }
  }

  // Encontrar próxima sesión de pago
  const nextPaymentSession = payOnSessions.find(s => s > purchase.usedSessions) || null;

  // Mensaje de alerta
  let message: string | null = null;
  if (overdueAmount > 0) {
    const overdueCount = overdueInstallments.length;
    if (overdueCount === 1) {
      message = `installmentOverdue:${overdueInstallments[0]}:${overdueAmount.toFixed(2)}`;
    } else {
      message = `installmentsOverdue:${overdueCount}:${overdueAmount.toFixed(2)}`;
    }
  }

  return {
    isUpToDate,
    isPaidInFull,
    expectedAmount,
    paidAmount,
    pendingAmount,
    overdueAmount,
    nextPaymentSession,
    nextPaymentAmount: installmentAmount,
    message,
    overdueInstallments
  };
}

/**
 * Obtiene el detalle de cada cuota
 */
export function getInstallmentsDetail(
  purchase: PackagePurchaseForPayment,
  payments: Array<{ amount: Prisma.Decimal | number; paidAt: Date }> = []
): InstallmentDetail[] {
  const totalPrice = toNumber(purchase.totalPrice) || toNumber(purchase.finalPrice);
  const installmentAmount = toNumber(purchase.installmentAmount) ||
    calculateInstallmentAmount(totalPrice, purchase.installments);

  const payOnSessions = parsePayOnSessions(purchase.installmentsPayOnSessions);
  const currentSession = purchase.usedSessions + 1;

  const result: InstallmentDetail[] = [];
  let remainingPaid = toNumber(purchase.paidAmount);

  for (let i = 0; i < purchase.installments; i++) {
    const paidForThis = Math.min(remainingPaid, installmentAmount);
    const payOnSession = payOnSessions[i] || null;

    let status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
    if (paidForThis >= installmentAmount - 0.01) { // Tolerancia de redondeo
      status = 'PAID';
    } else if (paidForThis > 0) {
      status = 'PARTIAL';
    } else if (payOnSession && payOnSession <= currentSession) {
      status = 'OVERDUE';
    } else {
      status = 'PENDING';
    }

    // Buscar pago correspondiente (aproximado por orden)
    const paymentIndex = result.filter(r => r.status === 'PAID').length;
    const correspondingPayment = payments[paymentIndex];

    result.push({
      number: i + 1,
      amount: installmentAmount,
      payOnSession,
      status,
      paidAmount: paidForThis,
      paidAt: status === 'PAID' && correspondingPayment ? correspondingPayment.paidAt : null
    });

    remainingPaid = Math.max(0, remainingPaid - installmentAmount);
  }

  return result;
}

/**
 * Valida si puede usar la siguiente sesión (para alertas, NO bloqueo)
 */
export function canUseNextSession(purchase: PackagePurchaseForPayment): CanUseSessionResult {
  // Verificar si hay sesiones disponibles
  if (purchase.remainingSessions <= 0) {
    return {
      allowed: false,
      hasWarning: false,
      warningMessage: 'noSessionsRemaining',
      overdueAmount: 0,
      paymentStatus: getPaymentStatus(purchase)
    };
  }

  const paymentStatus = getPaymentStatus(purchase);

  return {
    allowed: true,  // Siempre permitimos (solo alertamos)
    hasWarning: !paymentStatus.isUpToDate,
    warningMessage: paymentStatus.message,
    overdueAmount: paymentStatus.overdueAmount,
    paymentStatus
  };
}

/**
 * Calcula cuántas cuotas se han pagado completamente
 */
export function getPaidInstallmentsCount(purchase: PackagePurchaseForPayment): number {
  const totalPrice = toNumber(purchase.totalPrice) || toNumber(purchase.finalPrice);
  const installmentAmount = toNumber(purchase.installmentAmount) ||
    calculateInstallmentAmount(totalPrice, purchase.installments);

  if (installmentAmount <= 0) return 0;

  const paidAmount = toNumber(purchase.paidAmount);
  return Math.floor(paidAmount / installmentAmount);
}

/**
 * Obtiene el saldo pendiente total
 */
export function getRemainingBalance(purchase: PackagePurchaseForPayment): number {
  const totalPrice = toNumber(purchase.totalPrice) || toNumber(purchase.finalPrice);
  const paidAmount = toNumber(purchase.paidAmount);
  return Math.max(0, totalPrice - paidAmount);
}

/**
 * Verifica si el paquete tiene cuotas pendientes
 */
export function hasPendingInstallments(purchase: PackagePurchaseForPayment): boolean {
  return getRemainingBalance(purchase) > 0;
}

/**
 * Genera sugerencia de sesiones de pago distribuidas uniformemente
 */
export function suggestPayOnSessions(totalSessions: number, installmentsCount: number): number[] {
  if (installmentsCount <= 0 || totalSessions <= 0) return [];
  if (installmentsCount >= totalSessions) {
    return Array.from({ length: totalSessions }, (_, i) => i + 1);
  }

  const step = Math.max(1, Math.floor(totalSessions / installmentsCount));
  const suggested: number[] = [];

  for (let i = 0; i < installmentsCount; i++) {
    const session = 1 + (i * step);
    if (session <= totalSessions) {
      suggested.push(session);
    }
  }

  // Asegurar que tengamos suficientes
  while (suggested.length < installmentsCount && suggested[suggested.length - 1] < totalSessions) {
    suggested.push(suggested[suggested.length - 1] + 1);
  }

  return suggested.slice(0, installmentsCount);
}

/**
 * Formatea el mensaje de alerta para mostrar al usuario
 */
export function formatPaymentAlertMessage(
  message: string | null,
  t: (key: string, params?: Record<string, unknown>) => string
): string | null {
  if (!message) return null;

  const parts = message.split(':');

  if (parts[0] === 'installmentOverdue') {
    const installmentNumber = parts[1];
    const amount = parts[2];
    return t('packages.installments.alerts.installmentOverdue', {
      number: installmentNumber,
      amount
    });
  }

  if (parts[0] === 'installmentsOverdue') {
    const count = parts[1];
    const amount = parts[2];
    return t('packages.installments.alerts.installmentsOverdue', {
      count,
      amount
    });
  }

  return message;
}

// ============================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================

/**
 * Alias for backwards compatibility
 */
export const getPaidInstallments = getPaidInstallmentsCount;

/**
 * Alias for backwards compatibility
 */
export const getInstallmentsStatus = getInstallmentsDetail;

/**
 * Calcula cuántas sesiones habilita cada cuota
 */
export function getSessionsPerInstallment(totalSessions: number, installments: number): number {
  if (installments <= 0) return totalSessions;
  return Math.ceil(totalSessions / installments);
}

/**
 * Obtiene el número de la próxima cuota a pagar
 * Returns null if all installments are paid
 */
export function getNextInstallmentToPay(purchase: PackagePurchaseForPayment): number | null {
  const paidCount = getPaidInstallmentsCount(purchase);
  if (paidCount >= purchase.installments) {
    return null;
  }
  return paidCount + 1;
}

/**
 * Obtiene un resumen del estado de pago (para UI)
 */
export function getPaymentSummary(purchase: PackagePurchaseForPayment): {
  paidInstallments: number;
  totalInstallments: number;
  paidAmount: number;
  totalAmount: number;
  remainingAmount: number;
  percentagePaid: number;
} {
  const totalPrice = toNumber(purchase.totalPrice) || toNumber(purchase.finalPrice);
  const paidAmount = toNumber(purchase.paidAmount);
  const paidInstallments = getPaidInstallmentsCount(purchase);

  return {
    paidInstallments,
    totalInstallments: purchase.installments,
    paidAmount,
    totalAmount: totalPrice,
    remainingAmount: Math.max(0, totalPrice - paidAmount),
    percentagePaid: totalPrice > 0 ? Math.round((paidAmount / totalPrice) * 100) : 0,
  };
}

// Legacy type alias
export type InstallmentStatus = InstallmentDetail;
