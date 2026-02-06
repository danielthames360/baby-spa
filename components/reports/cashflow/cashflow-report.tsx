"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency-utils";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";

interface PaymentMethodItem {
  method: string;
  income: number;
  expense: number;
  net: number;
}

interface CashflowReportProps {
  data: {
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
    byPaymentMethod: PaymentMethodItem[];
    projection: {
      upcomingAppointments: number;
      estimatedFromAppointments: number;
      pendingInstallments: number;
    };
  };
  locale: string;
}

const METHOD_ICONS: Record<string, typeof Banknote> = {
  CASH: Banknote,
  QR: QrCode,
  TRANSFER: ArrowLeftRight,
  CARD: CreditCard,
};

const METHOD_COLORS: Record<string, string> = {
  CASH: "from-green-50 to-emerald-50",
  QR: "from-violet-50 to-purple-50",
  TRANSFER: "from-blue-50 to-sky-50",
  CARD: "from-amber-50 to-orange-50",
};

const METHOD_ICON_COLORS: Record<string, string> = {
  CASH: "text-green-600",
  QR: "text-violet-600",
  TRANSFER: "text-blue-600",
  CARD: "text-amber-600",
};

const METHOD_NET_COLORS: Record<string, string> = {
  CASH: "text-green-700",
  QR: "text-violet-700",
  TRANSFER: "text-blue-700",
  CARD: "text-amber-700",
};

export function CashflowReportComponent({ data, locale }: CashflowReportProps) {
  const t = useTranslations("reports");

  const isPositive = data.netCashflow >= 0;

  return (
    <div className="space-y-6">
      {/* Net Cashflow Summary */}
      <div className={cn(
        "rounded-2xl border border-white/50 p-6 shadow-lg backdrop-blur-md",
        isPositive
          ? "bg-gradient-to-br from-emerald-100/70 via-green-50/60 to-white"
          : "bg-gradient-to-br from-rose-100/70 via-pink-50/60 to-white"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t("cashflow.netCashflow")}</p>
            <p className={cn(
              "text-3xl font-bold",
              isPositive ? "text-emerald-700" : "text-rose-700"
            )}>
              {isPositive ? "+" : ""}{formatCurrency(data.netCashflow, locale)}
            </p>
          </div>
          <div className={cn(
            "rounded-xl p-3",
            isPositive
              ? "bg-gradient-to-br from-emerald-200/80 to-green-200/80"
              : "bg-gradient-to-br from-rose-200/80 to-pink-200/80"
          )}>
            {isPositive ? (
              <TrendingUp className="h-6 w-6 text-emerald-700" />
            ) : (
              <TrendingDown className="h-6 w-6 text-rose-700" />
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {data.byPaymentMethod.length > 0 && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("cashflow.byPaymentMethod")}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.byPaymentMethod.map((item) => {
              const Icon = METHOD_ICONS[item.method] || CreditCard;
              const bgColor = METHOD_COLORS[item.method] || "from-gray-50 to-gray-100";
              const iconColor = METHOD_ICON_COLORS[item.method] || "text-gray-600";
              const netColor = METHOD_NET_COLORS[item.method] || "text-gray-700";

              return (
                <div key={item.method} className={cn("rounded-xl bg-gradient-to-br p-4", bgColor)}>
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", iconColor)} />
                    <span className="font-semibold text-gray-800">
                      {t(`cashflow.method_${item.method}`)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("cashflow.income")}</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(item.income, locale)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("cashflow.expenses")}</span>
                      <span className="font-medium text-rose-600">
                        {formatCurrency(item.expense, locale)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">{t("cashflow.net")}</span>
                        <span className={cn("font-bold", netColor)}>
                          {formatCurrency(item.net, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t("cashflow.income")}
              </h3>
            </div>
            <span className="text-xl font-bold text-emerald-700">
              {formatCurrency(data.income.total, locale)}
            </span>
          </div>

          <div className="space-y-3">
            <LineItem
              label={t("cashflow.sessions")}
              value={formatCurrency(data.income.sessions, locale)}
              percent={data.income.total > 0 ? (data.income.sessions / data.income.total) * 100 : 0}
              variant="success"
            />
            <LineItem
              label={t("cashflow.babyCards")}
              value={formatCurrency(data.income.babyCards, locale)}
              percent={data.income.total > 0 ? (data.income.babyCards / data.income.total) * 100 : 0}
              variant="success"
            />
            <LineItem
              label={t("cashflow.events")}
              value={formatCurrency(data.income.events, locale)}
              percent={data.income.total > 0 ? (data.income.events / data.income.total) * 100 : 0}
              variant="success"
            />
            <LineItem
              label={t("cashflow.installments")}
              value={formatCurrency(data.income.installments, locale)}
              percent={data.income.total > 0 ? (data.income.installments / data.income.total) * 100 : 0}
              variant="success"
            />
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-rose-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t("cashflow.expenses")}
              </h3>
            </div>
            <span className="text-xl font-bold text-rose-700">
              {formatCurrency(data.expenses.total, locale)}
            </span>
          </div>

          <div className="space-y-3">
            <LineItem
              label={t("cashflow.payroll")}
              value={formatCurrency(data.expenses.payroll, locale)}
              percent={data.expenses.total > 0 ? (data.expenses.payroll / data.expenses.total) * 100 : 0}
              variant="danger"
            />
            <LineItem
              label={t("cashflow.operating")}
              value={formatCurrency(data.expenses.operating, locale)}
              percent={data.expenses.total > 0 ? (data.expenses.operating / data.expenses.total) * 100 : 0}
              variant="danger"
            />
          </div>
        </div>
      </div>

      {/* Projection */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t("cashflow.projection")}
          </h3>
          <span className="text-sm text-gray-500">({t("cashflow.next30Days")})</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <p className="text-sm text-gray-600">{t("cashflow.upcomingAppointments")}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-teal-700">
              {data.projection.upcomingAppointments}
            </p>
            <p className="text-sm text-gray-500">
              ≈ {formatCurrency(data.projection.estimatedFromAppointments, locale)}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-gray-600">{t("cashflow.pendingInstallments")}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {formatCurrency(data.projection.pendingInstallments, locale)}
            </p>
            <p className="text-sm text-gray-500">{t("cashflow.toCollect")}</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-gray-600">{t("cashflow.projectedTotal")}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {formatCurrency(
                data.projection.estimatedFromAppointments + data.projection.pendingInstallments,
                locale
              )}
            </p>
            <p className="text-sm text-gray-500">{t("cashflow.potentialIncome")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineItem({
  label,
  value,
  percent,
  variant,
}: {
  label: string;
  value: string;
  percent: number;
  variant: "success" | "danger";
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full",
            variant === "success"
              ? "bg-gradient-to-r from-emerald-300 to-green-300"
              : "bg-gradient-to-r from-rose-300 to-pink-300"
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
