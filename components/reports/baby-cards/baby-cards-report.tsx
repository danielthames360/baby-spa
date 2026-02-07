"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/currency-utils";
import {
  CreditCard,
  Gift,
  TrendingUp,
  CheckCircle,
  Star,
  Baby,
} from "lucide-react";

interface BabyCardsReportProps {
  data: {
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
  };
  locale: string;
}

export function BabyCardsReportComponent({ data, locale }: BabyCardsReportProps) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title={t("babyCards.sold")}
          value={formatNumber(data.summary.soldInPeriod, locale)}
          icon={<CreditCard className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("babyCards.revenue")}
          value={formatCurrency(data.summary.revenueInPeriod, locale)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("babyCards.active")}
          value={formatNumber(data.summary.activeCards, locale)}
          icon={<Star className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("babyCards.completed")}
          value={formatNumber(data.summary.completedCards, locale)}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              {t("babyCards.progress")}
            </h3>
            <div className="text-right">
              <span className="text-2xl font-bold text-teal-700">
                {formatPercent(data.progress.averageProgress, locale, 0)}
              </span>
              <p className="text-xs text-gray-500">{t("babyCards.avgProgress")}</p>
            </div>
          </div>

          {data.progress.list.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("babyCards.noProgress")}</p>
          ) : (
            <div className="space-y-3">
              {data.progress.list.map((card) => (
                <div
                  key={card.babyId}
                  className="rounded-xl bg-gradient-to-r from-teal-50/50 to-cyan-50/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-cyan-200">
                        <Baby className="h-5 w-5 text-teal-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{card.babyName}</p>
                        <p className="text-sm text-gray-500">{card.cardName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-teal-700">
                        {card.completedSessions}/{card.totalSessions}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercent(card.progressPercent, locale, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-300 to-cyan-300"
                      style={{ width: `${card.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards */}
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t("babyCards.rewards")}
            </h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <p className="text-2xl font-bold text-amber-700">{formatNumber(data.rewards.unlocked, locale)}</p>
                <p className="text-sm text-gray-600">{t("babyCards.unlocked")}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-4">
                <p className="text-2xl font-bold text-emerald-700">{formatNumber(data.rewards.delivered, locale)}</p>
                <p className="text-sm text-gray-600">{t("babyCards.delivered")}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                <p className="text-2xl font-bold text-teal-700">
                  {formatPercent(data.rewards.deliveryRate, locale, 0)}
                </p>
                <p className="text-sm text-gray-600">{t("babyCards.deliveryRate")}</p>
              </div>
            </div>

            {/* Delivery Rate Bar */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("babyCards.deliveryProgress")}</span>
                <span className="font-medium text-gray-800">
                  {data.rewards.delivered}/{data.rewards.unlocked}
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    data.rewards.deliveryRate >= 80
                      ? "bg-gradient-to-r from-emerald-300 to-green-300"
                      : "bg-gradient-to-r from-amber-300 to-orange-300"
                  )}
                  style={{ width: `${data.rewards.deliveryRate}%` }}
                />
              </div>
            </div>
          </div>
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
};

function SummaryCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "default" | "success";
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
        </div>
        <div className={cn("rounded-xl p-2", styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
