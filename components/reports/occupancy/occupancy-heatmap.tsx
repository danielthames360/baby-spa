"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Calendar, TrendingUp, Clock, Lightbulb } from "lucide-react";

interface OccupancyHeatmapProps {
  data: {
    heatmap: {
      dayOfWeek: number;
      time: string;
      appointments: number;
      maxCapacity: number;
      occupancyRate: number;
      level: "high" | "medium" | "low";
    }[];
    overall: {
      totalAppointments: number;
      totalSlots: number;
      occupancyRate: number;
    };
  };
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:30", "15:30", "16:30"];

export function OccupancyHeatmap({ data }: OccupancyHeatmapProps) {
  const t = useTranslations("reports");

  // Group heatmap data by time slot
  const heatmapByTime = new Map<string, Map<number, typeof data.heatmap[0]>>();
  for (const slot of data.heatmap) {
    if (!heatmapByTime.has(slot.time)) {
      heatmapByTime.set(slot.time, new Map());
    }
    heatmapByTime.get(slot.time)!.set(slot.dayOfWeek, slot);
  }

  // Find low occupancy slots for suggestions
  const lowOccupancySlots = data.heatmap.filter((s) => s.level === "low" && s.occupancyRate < 40);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title={t("occupancy.totalAppointments")}
          value={data.overall.totalAppointments.toString()}
          icon={<Calendar className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("occupancy.totalSlots")}
          value={data.overall.totalSlots.toString()}
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />
        <SummaryCard
          title={t("occupancy.rate")}
          value={`${data.overall.occupancyRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant={data.overall.occupancyRate >= 70 ? "success" : data.overall.occupancyRate >= 50 ? "warning" : "danger"}
        />
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t("occupancy.heatmap")}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-medium text-gray-500"></th>
                {[1, 2, 3, 4, 5, 6].map((day) => (
                  <th key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                    {DAY_NAMES[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time) => (
                <tr key={time}>
                  <td className="p-2 text-sm font-medium text-gray-600">{time}</td>
                  {[1, 2, 3, 4, 5, 6].map((day) => {
                    const slot = heatmapByTime.get(time)?.get(day);
                    if (!slot) {
                      return (
                        <td key={day} className="p-1">
                          <div className="h-12 rounded-lg bg-gray-100" />
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="p-1">
                        <div
                          className={cn(
                            "flex h-12 items-center justify-center rounded-lg text-sm font-medium transition-all hover:scale-105",
                            slot.level === "high" && "bg-gradient-to-br from-emerald-300 to-green-300 text-emerald-800",
                            slot.level === "medium" && "bg-gradient-to-br from-amber-200 to-orange-200 text-amber-800",
                            slot.level === "low" && "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                          )}
                          title={`${slot.appointments}/${slot.maxCapacity} (${slot.occupancyRate.toFixed(0)}%)`}
                        >
                          {slot.occupancyRate.toFixed(0)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-emerald-300 to-green-300" />
            <span className="text-sm text-gray-600">{t("occupancy.high")} (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-amber-200 to-orange-200" />
            <span className="text-sm text-gray-600">{t("occupancy.medium")} (50-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
            <span className="text-sm text-gray-600">{t("occupancy.low")} (&lt;50%)</span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {lowOccupancySlots.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{t("occupancy.opportunity")}</p>
              <p className="mt-1 text-sm text-amber-600">
                {t("occupancy.lowOccupancySlots")}:{" "}
                {lowOccupancySlots
                  .slice(0, 3)
                  .map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.time}`)
                  .join(", ")}
              </p>
              <p className="mt-1 text-sm text-amber-600">{t("occupancy.suggestion")}</p>
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
