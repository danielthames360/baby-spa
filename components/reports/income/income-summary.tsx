"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency, formatPercent } from "@/lib/utils/currency-utils";
import { PaymentMethod, TransactionCategory } from "@prisma/client";
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  QrCode,
  DollarSign,
  Stethoscope,
  CreditCard as CardIcon,
  CalendarCheck,
  Calendar,
  Receipt,
  Package,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Categories that represent income sources
type IncomeCategory = Extract<
  TransactionCategory,
  | "SESSION"
  | "PACKAGE_SALE"
  | "PACKAGE_INSTALLMENT"
  | "SESSION_PRODUCTS"
  | "EVENT_PRODUCTS"
  | "BABY_CARD"
  | "EVENT_REGISTRATION"
  | "APPOINTMENT_ADVANCE"
>;

interface IncomeSummaryProps {
  total: number;
  grossTotal?: number;
  totalDiscounts?: number;
  discountsByCategory?: { category: string; amount: number; count: number }[];
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  bySource?: { source: TransactionCategory; amount: number; count: number }[];
  locale: string;
}

const METHOD_ICONS = {
  CASH: Banknote,
  QR: QrCode,
  CARD: CreditCard,
  TRANSFER: ArrowRightLeft,
};

const METHOD_COLORS = {
  CASH: "bg-emerald-100 text-emerald-700",
  QR: "bg-purple-100 text-purple-700",
  CARD: "bg-blue-100 text-blue-700",
  TRANSFER: "bg-amber-100 text-amber-700",
};

const SOURCE_ICONS: Partial<Record<TransactionCategory, typeof Stethoscope>> = {
  SESSION: Stethoscope,
  PACKAGE_SALE: Package,
  PACKAGE_INSTALLMENT: Receipt,
  SESSION_PRODUCTS: ShoppingBag,
  EVENT_PRODUCTS: ShoppingBag,
  BABY_CARD: CardIcon,
  EVENT_REGISTRATION: CalendarCheck,
  APPOINTMENT_ADVANCE: Calendar,
};

const SOURCE_COLORS: Partial<Record<TransactionCategory, string>> = {
  SESSION: "bg-teal-100 text-teal-700",
  PACKAGE_SALE: "bg-emerald-100 text-emerald-700",
  PACKAGE_INSTALLMENT: "bg-cyan-100 text-cyan-700",
  SESSION_PRODUCTS: "bg-amber-100 text-amber-700",
  EVENT_PRODUCTS: "bg-yellow-100 text-yellow-700",
  BABY_CARD: "bg-pink-100 text-pink-700",
  EVENT_REGISTRATION: "bg-indigo-100 text-indigo-700",
  APPOINTMENT_ADVANCE: "bg-orange-100 text-orange-700",
};

// Order for display - income categories only
const SOURCE_ORDER: IncomeCategory[] = [
  "SESSION",
  "PACKAGE_SALE",
  "PACKAGE_INSTALLMENT",
  "SESSION_PRODUCTS",
  "EVENT_PRODUCTS",
  "BABY_CARD",
  "EVENT_REGISTRATION",
  "APPOINTMENT_ADVANCE",
];

// Payment methods array hoisted to module level to prevent re-creation on every render
const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "QR", "CARD", "TRANSFER"];

export function IncomeSummary({ total, grossTotal, totalDiscounts, discountsByCategory, byMethod, bySource, locale }: IncomeSummaryProps) {
  const t = useTranslations("reports.income");
  const tPayment = useTranslations("payment");

  const hasDiscounts = totalDiscounts && totalDiscounts > 0;

  // Memoize discounts map to avoid recomputation on every render
  const discountsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (discountsByCategory) {
      for (const d of discountsByCategory) {
        map.set(d.category, d.amount);
      }
    }
    return map;
  }, [discountsByCategory]);

  return (
    <div className="space-y-6">
      {/* Total with Discounts Breakdown */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Net Total */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-3">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t("totalIncome")}</p>
              <p className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
                {formatCurrency(total, locale)}
              </p>
            </div>
          </div>

          {/* Gross and Discounts */}
          {hasDiscounts && grossTotal && (
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{t("grossIncome")}:</span>
                <span className="font-medium text-gray-700">{formatCurrency(grossTotal, locale)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-rose-500">
                <span>(-) {t("discounts")}:</span>
                <span className="font-medium">{formatCurrency(totalDiscounts, locale)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* By Source */}
      {bySource && bySource.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("bySource")}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SOURCE_ORDER.map((source) => {
              const data = bySource.find((s) => s.source === source) || {
                amount: 0,
                count: 0,
              };
              const Icon = SOURCE_ICONS[source] || Receipt;
              const colorClass = SOURCE_COLORS[source] || "bg-gray-100 text-gray-700";
              const percentage = total > 0 ? (data.amount / total) * 100 : 0;
              const discount = discountsMap.get(source) || 0;

              return (
                <div
                  key={source}
                  className="rounded-xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-gray-500">{t(`sources.${source}`)}</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatCurrency(data.amount, locale)}
                      </p>
                      {discount > 0 && (
                        <p className="text-xs text-rose-500">
                          -{formatCurrency(discount, locale)} {t("discounts").toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{data.count}</span>
                      <span>{formatPercent(percentage, locale)}</span>
                    </div>
                    <div className="mt-1 h-1 w-full rounded-full bg-gray-50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gray-200 to-gray-300 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By Method */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PAYMENT_METHODS.map((method) => {
          const data = byMethod.find((m) => m.method === method) || {
            amount: 0,
            count: 0,
          };
          const Icon = METHOD_ICONS[method];
          const percentage = total > 0 ? (data.amount / total) * 100 : 0;

          return (
            <div
              key={method}
              className="rounded-xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", METHOD_COLORS[method])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{tPayment(`methods.${method.toLowerCase()}`)}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(data.amount, locale)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{data.count} {t("transactions")}</span>
                  <span>{formatPercent(percentage, locale)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      method === "CASH" && "bg-gradient-to-r from-emerald-200 to-emerald-300",
                      method === "QR" && "bg-gradient-to-r from-purple-200 to-purple-300",
                      method === "CARD" && "bg-gradient-to-r from-blue-200 to-blue-300",
                      method === "TRANSFER" && "bg-gradient-to-r from-amber-200 to-amber-300"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
