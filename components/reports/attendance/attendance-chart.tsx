"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AttendanceStats {
  date: string;
  completed: number;
  noShow: number;
  cancelled: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceStats[];
  locale: string;
}

// Format date helper hoisted outside component to prevent re-creation on every render
function formatAttendanceDate(dateStr: string, locale: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-BO", {
    day: "2-digit",
    month: "short",
  });
}

export function AttendanceChart({ data, locale }: AttendanceChartProps) {
  const t = useTranslations("reports.attendance");

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-md">
        <p className="text-gray-500">{t("noData")}</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("dailyAttendance")}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-teal-400" />
            <span className="text-gray-600">{t("completed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-300" />
            <span className="text-gray-600">{t("noShow")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="text-gray-600">{t("cancelled")}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((day) => {
          const completedWidth = (day.completed / maxValue) * 100;
          const noShowWidth = (day.noShow / maxValue) * 100;
          const cancelledWidth = (day.cancelled / maxValue) * 100;

          return (
            <div key={day.date} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">
                {formatAttendanceDate(day.date, locale)}
              </span>
              <div className="flex flex-1 items-center gap-0.5">
                {/* Completed */}
                {day.completed > 0 && (
                  <div
                    className="h-6 rounded-l-lg bg-gradient-to-r from-teal-300 to-cyan-300 transition-all"
                    style={{ width: `${completedWidth}%` }}
                    title={`${day.completed} ${t("completed")}`}
                  />
                )}
                {/* No Show */}
                {day.noShow > 0 && (
                  <div
                    className={cn(
                      "h-6 bg-gradient-to-r from-rose-200 to-rose-300 transition-all",
                      day.completed === 0 && "rounded-l-lg"
                    )}
                    style={{ width: `${noShowWidth}%` }}
                    title={`${day.noShow} ${t("noShow")}`}
                  />
                )}
                {/* Cancelled */}
                {day.cancelled > 0 && (
                  <div
                    className={cn(
                      "h-6 rounded-r-lg bg-gradient-to-r from-amber-200 to-amber-300 transition-all",
                      day.completed === 0 && day.noShow === 0 && "rounded-l-lg"
                    )}
                    style={{ width: `${cancelledWidth}%` }}
                    title={`${day.cancelled} ${t("cancelled")}`}
                  />
                )}
                {/* Empty space if no data */}
                {day.total === 0 && (
                  <div className="h-6 flex-1 rounded-lg bg-gray-50" />
                )}
              </div>
              <span className="w-12 text-right text-xs text-gray-600">
                {day.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
