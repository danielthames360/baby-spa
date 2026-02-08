"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/currency-utils";
import {
  Package,
  TrendingUp,
  BarChart3,
  Percent,
  Moon,
} from "lucide-react";

interface PackagesReportProps {
  data: {
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
  };
  locale: string;
}

export function PackagesReport({ data, locale }: PackagesReportProps) {
  const t = useTranslations("reports");

  // Memoize derived totals to avoid recomputation on every render
  const { totalRevenue, totalSold } = useMemo(
    () => data.sales.reduce(
      (acc, s) => {
        acc.totalRevenue += s.revenue;
        acc.totalSold += s.sold;
        return acc;
      },
      { totalRevenue: 0, totalSold: 0 }
    ),
    [data.sales]
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title={t("packages.totalSold")}
          value={formatNumber(totalSold, locale)}
          icon={<Package className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("packages.revenue")}
          value={formatCurrency(totalRevenue, locale)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("packages.utilizationRate")}
          value={formatPercent(data.utilization.rate, locale)}
          icon={<BarChart3 className="h-5 w-5" />}
          variant={data.utilization.rate >= 70 ? "success" : "warning"}
        />
        <SummaryCard
          title={t("packages.discountsGiven")}
          value={formatCurrency(data.discounts.totalAmount, locale)}
          subtitle={`${formatNumber(data.discounts.count, locale)} ${t("packages.discountsCount")}`}
          icon={<Percent className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Package */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            {t("packages.salesByPackage")}
          </h3>

          {data.sales.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("packages.noSales")}</p>
          ) : (
            <div className="space-y-3">
              {data.sales.map((pkg, index) => {
                const percentOfTotal = totalRevenue > 0
                  ? (pkg.revenue / totalRevenue) * 100
                  : 0;

                return (
                  <div
                    key={pkg.packageId}
                    className="rounded-xl bg-gradient-to-r from-teal-50/50 to-cyan-50/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-cyan-200">
                          <span className="text-sm font-bold text-teal-800">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{pkg.packageName}</p>
                          <p className="text-sm text-gray-500">
                            {pkg.sold} {t("packages.unitsSold")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-teal-700">
                          {formatCurrency(pkg.revenue, locale)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercent(percentOfTotal, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-300 to-cyan-300"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Utilization */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {t("packages.utilization")}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t("packages.sessionsSold")}</span>
                <span className="font-semibold text-gray-800">{formatNumber(data.utilization.totalSold, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t("packages.sessionsUsed")}</span>
                <span className="font-semibold text-gray-800">{formatNumber(data.utilization.totalUsed, locale)}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    data.utilization.rate >= 70
                      ? "bg-gradient-to-r from-emerald-300 to-green-300"
                      : "bg-gradient-to-r from-amber-300 to-orange-300"
                  )}
                  style={{ width: `${Math.min(data.utilization.rate, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className={cn(
                  "text-2xl font-bold",
                  data.utilization.rate >= 70 ? "text-emerald-700" : "text-amber-700"
                )}>
                  {formatPercent(data.utilization.rate, locale)}
                </span>
                <span className="ml-2 text-sm text-gray-500">{t("packages.utilizationRate")}</span>
              </div>
            </div>
          </div>

          {/* Dormant Packages Alert */}
          {data.utilization.dormantCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
              <div className="flex items-start gap-3">
                <Moon className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    {t("packages.dormantPackages")}
                  </p>
                  <p className="mt-1 text-sm text-amber-600">
                    {data.utilization.dormantCount} {t("packages.dormantDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Style constants hoisted outside component to prevent re-creation on every render
const SUMMARY_VARIANT_STYLES = {
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
};

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
  icon: React.ReactNode;
  variant: "default" | "success" | "warning";
}) {
  const styles = SUMMARY_VARIANT_STYLES[variant];

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
        <div className={cn("rounded-xl p-2", styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
