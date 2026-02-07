"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { cn } from "@/lib/utils";

interface IncomeByDay {
  date: string;
  total: number;
}

interface IncomeChartProps {
  data: IncomeByDay[];
  locale: string;
}

// Format date helper hoisted outside component to prevent re-creation on every render
function formatIncomeDate(dateStr: string, locale: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "es-BO", {
    day: "2-digit",
    month: "short",
  });
}

export function IncomeChart({ data, locale }: IncomeChartProps) {
  const t = useTranslations("reports.income");

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
      <h3 className="mb-4 font-semibold text-gray-900">{t("dailyIncome")}</h3>

      <div className="space-y-2">
        {data.map((day) => {
          const percentage = (day.total / maxValue) * 100;

          return (
            <div key={day.date} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">
                {formatIncomeDate(day.date, locale)}
              </span>
              <div className="flex-1">
                <div className="h-6 w-full rounded-lg bg-gray-50">
                  <div
                    className={cn(
                      "flex h-full items-center rounded-lg bg-gradient-to-r from-teal-200 to-cyan-200 px-2 text-xs font-medium text-teal-700 transition-all",
                      percentage < 20 && "justify-end pr-2"
                    )}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    {percentage >= 20 && (
                      <span>{formatCurrency(day.total, locale)}</span>
                    )}
                  </div>
                </div>
              </div>
              {percentage < 20 && (
                <span className="w-20 text-right text-xs text-gray-600">
                  {formatCurrency(day.total, locale)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
