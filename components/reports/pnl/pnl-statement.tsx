"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/utils/currency-utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
} from "lucide-react";

interface PnLStatementProps {
  data: {
    income: {
      sessions: number;
      babyCards: number;
      events: number;
      installments: number;
      advances?: number;
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
  };
  locale: string;
}

export function PnLStatement({ data, locale }: PnLStatementProps) {
  const t = useTranslations("reports");

  const formatAmount = (amount: number) => formatCurrency(amount, locale);
  const formatPct = (value: number) => formatPercent(value, locale);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title={t("pnl.totalIncome")}
          value={formatAmount(data.income.total)}
          icon="DollarSign"
          variant="success"
        />
        <SummaryCard
          title={t("pnl.grossMargin")}
          value={formatAmount(data.grossMargin)}
          icon="TrendingUp"
          variant="default"
        />
        <SummaryCard
          title={t("pnl.totalExpenses")}
          value={formatAmount(data.operatingExpenses.total)}
          icon="ShoppingCart"
          variant="warning"
        />
        <SummaryCard
          title={t("pnl.netResult")}
          value={formatAmount(data.netResult)}
          subtitle={formatPct(data.netMarginPercent)}
          icon={data.netResult >= 0 ? "TrendingUp" : "TrendingDown"}
          variant={data.netResult >= 0 ? "success" : "danger"}
        />
      </div>

      {/* P&L Statement */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
        <h3 className="mb-6 text-lg font-semibold text-gray-800">
          {t("pnl.statement")}
        </h3>

        <div className="space-y-6">
          {/* INGRESOS */}
          <Section title={t("pnl.income")} icon={<DollarSign className="h-5 w-5" />}>
            <LineItem label={t("pnl.sessions")} value={formatAmount(data.income.sessions)} />
            <LineItem label={t("pnl.babyCards")} value={formatAmount(data.income.babyCards)} />
            <LineItem label={t("pnl.events")} value={formatAmount(data.income.events)} />
            <LineItem label={t("pnl.installments")} value={formatAmount(data.income.installments)} />
            {(data.income.advances ?? 0) > 0 && (
              <LineItem label={t("pnl.advances")} value={formatAmount(data.income.advances ?? 0)} />
            )}
            <TotalLine label={t("pnl.totalIncome")} value={formatAmount(data.income.total)} variant="income" />
          </Section>

          {/* COSTOS DIRECTOS */}
          <Section title={t("pnl.directCosts")} icon={<ShoppingCart className="h-5 w-5" />}>
            <LineItem label={t("pnl.sessionProducts")} value={formatAmount(data.directCosts.sessionProducts)} />
            <LineItem label={t("pnl.eventProducts")} value={formatAmount(data.directCosts.eventProducts)} />
            <TotalLine label={t("pnl.totalDirectCosts")} value={formatAmount(data.directCosts.total)} variant="expense" />
          </Section>

          {/* MARGEN BRUTO */}
          <div className="border-t border-b border-gray-200 py-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">{t("pnl.grossMargin")}</span>
              <span className="text-lg font-bold text-teal-700">
                {formatAmount(data.grossMargin)}
              </span>
            </div>
          </div>

          {/* GASTOS OPERATIVOS */}
          <Section title={t("pnl.operatingExpenses")} icon={<Building2 className="h-5 w-5" />}>
            <LineItem label={t("pnl.payroll")} value={formatAmount(data.operatingExpenses.payroll)} />
            {data.operatingExpenses.byCategory.map((cat) => (
              <LineItem
                key={cat.category}
                label={t(`pnl.categories.${cat.category.toLowerCase()}`)}
                value={formatAmount(cat.amount)}
              />
            ))}
            <TotalLine
              label={t("pnl.totalOperatingExpenses")}
              value={formatAmount(data.operatingExpenses.total)}
              variant="expense"
            />
          </Section>

          {/* RESULTADO NETO */}
          <div className={cn(
            "rounded-xl p-4",
            data.netResult >= 0
              ? "bg-gradient-to-r from-emerald-100/80 to-green-100/80"
              : "bg-gradient-to-r from-rose-100/80 to-pink-100/80"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.netResult >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-rose-600" />
                )}
                <span className="text-lg font-bold text-gray-800">{t("pnl.netResult")}</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xl font-bold",
                  data.netResult >= 0 ? "text-emerald-700" : "text-rose-700"
                )}>
                  {formatAmount(data.netResult)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({formatPct(data.netMarginPercent)} {t("pnl.margin")})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  variant: "default" | "success" | "warning" | "danger";
}) {
  const VARIANT_STYLES = {
    default: {
      cardBg: "bg-gradient-to-br from-teal-100/70 via-cyan-50/60 to-white",
      border: "border-l-teal-400",
      iconBg: "bg-gradient-to-br from-teal-200/80 to-cyan-200/80",
      iconColor: "text-teal-700",
      valueColor: "text-teal-700",
    },
    success: {
      cardBg: "bg-gradient-to-br from-emerald-100/70 via-green-50/60 to-white",
      border: "border-l-emerald-400",
      iconBg: "bg-gradient-to-br from-emerald-200/80 to-green-200/80",
      iconColor: "text-emerald-700",
      valueColor: "text-emerald-700",
    },
    warning: {
      cardBg: "bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-white",
      border: "border-l-amber-500",
      iconBg: "bg-gradient-to-br from-amber-200/80 to-orange-200/80",
      iconColor: "text-amber-700",
      valueColor: "text-amber-700",
    },
    danger: {
      cardBg: "bg-gradient-to-br from-rose-100/70 via-pink-50/60 to-white",
      border: "border-l-rose-400",
      iconBg: "bg-gradient-to-br from-rose-200/80 to-pink-200/80",
      iconColor: "text-rose-700",
      valueColor: "text-rose-700",
    },
  };

  const styles = VARIANT_STYLES[variant];
  const IconComponent = { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Users }[icon] || DollarSign;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/50 p-4 shadow-lg backdrop-blur-md border-l-4",
      styles.cardBg,
      styles.border
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={cn("text-2xl font-bold", styles.valueColor)}>{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className={cn("rounded-xl p-2", styles.iconBg)}>
          <IconComponent className={cn("h-5 w-5", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="ml-7 space-y-2">{children}</div>
    </div>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}

function TotalLine({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "income" | "expense";
}) {
  return (
    <div className={cn(
      "mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2",
      variant === "income" ? "text-emerald-700" : "text-amber-700"
    )}>
      <span className="font-semibold">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
