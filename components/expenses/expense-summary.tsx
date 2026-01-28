"use client";

import { useTranslations } from "next-intl";
import {
  Home,
  Lightbulb,
  ShoppingBag,
  Wrench,
  Megaphone,
  FileText,
  Shield,
  Monitor,
  MoreHorizontal,
  TrendingDown,
} from "lucide-react";

// Category icons mapping
const CATEGORY_ICONS = {
  RENT: Home,
  UTILITIES: Lightbulb,
  SUPPLIES: ShoppingBag,
  MAINTENANCE: Wrench,
  MARKETING: Megaphone,
  TAXES: FileText,
  INSURANCE: Shield,
  EQUIPMENT: Monitor,
  OTHER: MoreHorizontal,
} as const;

// Category colors for background
const CATEGORY_BG_COLORS = {
  RENT: "bg-purple-100",
  UTILITIES: "bg-yellow-100",
  SUPPLIES: "bg-blue-100",
  MAINTENANCE: "bg-orange-100",
  MARKETING: "bg-pink-100",
  TAXES: "bg-gray-100",
  INSURANCE: "bg-green-100",
  EQUIPMENT: "bg-indigo-100",
  OTHER: "bg-slate-100",
} as const;

// Category colors for icon
const CATEGORY_ICON_COLORS = {
  RENT: "text-purple-600",
  UTILITIES: "text-yellow-600",
  SUPPLIES: "text-blue-600",
  MAINTENANCE: "text-orange-600",
  MARKETING: "text-pink-600",
  TAXES: "text-gray-600",
  INSURANCE: "text-green-600",
  EQUIPMENT: "text-indigo-600",
  OTHER: "text-slate-600",
} as const;

interface CategorySummary {
  category: keyof typeof CATEGORY_ICONS;
  total: number;
  count: number;
}

interface ExpenseSummaryProps {
  summaryByCategory: CategorySummary[];
  total: number;
  locale: string;
}

export function ExpenseSummary({
  summaryByCategory,
  total,
  locale,
}: ExpenseSummaryProps) {
  const t = useTranslations("expenses");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">{t("summary.title")}</h2>
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2">
          <TrendingDown className="h-5 w-5 text-teal-600" />
          <span className="text-lg font-bold text-teal-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {summaryByCategory.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {summaryByCategory.map((item) => {
            const Icon = CATEGORY_ICONS[item.category];
            const bgColor = CATEGORY_BG_COLORS[item.category];
            const iconColor = CATEGORY_ICON_COLORS[item.category];

            return (
              <div
                key={item.category}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
              >
                <div className={`rounded-lg ${bgColor} p-2`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">
                    {t(`categories.${item.category}`)}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500">{t("summary.noData")}</p>
      )}
    </div>
  );
}
