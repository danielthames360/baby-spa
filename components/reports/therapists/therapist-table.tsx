"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatPercent, formatNumber } from "@/lib/utils/currency-utils";
import { User, Clock, ClipboardCheck, AlertTriangle, Trophy } from "lucide-react";

interface TherapistTableProps {
  data: {
    id: string;
    name: string;
    completedSessions: number;
    totalHours: number;
    evaluatedSessions: number;
    evaluationRate: number;
  }[];
  locale: string;
}

export function TherapistTable({ data, locale }: TherapistTableProps) {
  const t = useTranslations("reports");

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-12 text-center shadow-lg backdrop-blur-md">
        <User className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">{t("therapists.noData")}</p>
      </div>
    );
  }

  const totalSessions = data.reduce((sum, t) => sum + t.completedSessions, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t("therapists.totalSessions")}
          value={formatNumber(totalSessions, locale)}
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("therapists.activeTherapists")}
          value={formatNumber(data.length, locale)}
          icon={<User className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("therapists.avgEvaluationRate")}
          value={formatPercent(data.reduce((sum, t) => sum + t.evaluationRate, 0) / data.length, locale, 1)}
          icon={<ClipboardCheck className="h-5 w-5" />}
          variant={data.some((t) => t.evaluationRate < 80) ? "warning" : "success"}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                {t("therapists.rank")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                {t("therapists.therapist")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                {t("therapists.sessions")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                {t("therapists.hours")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                {t("therapists.evaluations")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                {t("therapists.evalRate")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                {t("therapists.workload")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((therapist, index) => {
              const workloadPercent = totalSessions > 0
                ? (therapist.completedSessions / totalSessions) * 100
                : 0;

              return (
                <tr
                  key={therapist.id}
                  className="border-b border-gray-50 transition-colors hover:bg-teal-50/30"
                >
                  <td className="px-6 py-4">
                    <RankBadge rank={index + 1} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-cyan-200">
                        <User className="h-5 w-5 text-teal-700" />
                      </div>
                      <span className="font-medium text-gray-800">{therapist.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {therapist.completedSessions}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {therapist.totalHours}h
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {therapist.evaluatedSessions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <EvaluationRateBadge rate={therapist.evaluationRate} locale={locale} />
                  </td>
                  <td className="px-6 py-4">
                    <WorkloadBar percent={workloadPercent} locale={locale} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alerts */}
      {data.some((t) => t.evaluationRate < 80) && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{t("therapists.alert")}</p>
              <p className="mt-1 text-sm text-amber-600">
                {data
                  .filter((t) => t.evaluationRate < 80)
                  .map((t) => t.name)
                  .join(", ")}{" "}
                {t("therapists.belowTarget")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning";
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
  };

  const styles = VARIANT_STYLES[variant];

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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-400">
        <Trophy className="h-4 w-4 text-amber-800" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400">
        <span className="text-sm font-bold text-gray-700">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700">
        <span className="text-sm font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
      <span className="text-sm font-medium text-gray-500">{rank}</span>
    </div>
  );
}

function EvaluationRateBadge({ rate, locale }: { rate: number; locale: string }) {
  const variant = rate >= 90 ? "success" : rate >= 80 ? "warning" : "danger";
  const colors = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", colors[variant])}>
      {formatPercent(rate, locale, 0)}
    </span>
  );
}

function WorkloadBar({ percent, locale }: { percent: number; locale: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{formatPercent(percent, locale, 0)}</span>
    </div>
  );
}
