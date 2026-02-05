"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils/currency-utils";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  PartyPopper,
} from "lucide-react";

interface EventsReportProps {
  data: {
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
  };
  locale: string;
}

export function EventsReportComponent({ data, locale }: EventsReportProps) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title={t("events.totalEvents")}
          value={formatNumber(data.summary.totalEvents, locale)}
          icon={<Calendar className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("events.participants")}
          value={formatNumber(data.summary.totalParticipants, locale)}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("events.revenue")}
          value={formatCurrency(data.summary.totalRevenue, locale)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <SummaryCard
          title={t("events.attendanceRate")}
          value={data.summary.attendanceRate > 100
            ? `${formatPercent(100, locale, 0)}+`
            : formatPercent(data.summary.attendanceRate, locale, 0)}
          icon={<CheckCircle className="h-5 w-5" />}
          variant={data.summary.attendanceRate >= 80 ? "success" : "warning"}
        />
      </div>

      {/* Events List */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            {t("events.eventsList")}
          </h3>
        </div>

        {data.events.length === 0 ? (
          <p className="py-8 text-center text-gray-500">{t("events.noEvents")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    {t("events.event")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    {t("events.type")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    {t("events.date")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    {t("events.attendance")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    {t("events.revenue")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    {t("events.margin")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-50 transition-colors hover:bg-teal-50/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{event.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                        event.type === "BABIES"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {event.type === "BABIES" ? t("events.typeBabies") : t("events.typeParents")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateForDisplay(new Date(event.date), locale === "pt-BR" ? "pt-BR" : "es-BO", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-gray-800">
                        {event.attended}/{event.participants}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(event.revenue, locale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-medium",
                        event.margin >= 70 ? "text-emerald-600" : event.margin >= 50 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {formatPercent(event.margin, locale, 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
