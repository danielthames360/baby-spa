"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDateString } from "@/lib/utils/date-utils";

interface DateRangeFilterProps {
  locale: string;
  basePath: string;
  defaultFrom?: string;
  defaultTo?: string;
}

export function DateRangeFilter({
  locale,
  basePath,
  defaultFrom,
  defaultTo,
}: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("reports");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = searchParams.get("from") || defaultFrom || formatLocalDateString(monthStart);
  const to = searchParams.get("to") || defaultTo || formatLocalDateString(monthEnd);

  const handleFilter = (newFrom: string, newTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`/${locale}${basePath}?${params.toString()}`);
  };

  const handleQuickFilter = (days: number | "month" | "year") => {
    const today = new Date();
    let newFrom: Date;
    let newTo: Date = today;

    if (days === "month") {
      newFrom = new Date(today.getFullYear(), today.getMonth(), 1);
      newTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (days === "year") {
      newFrom = new Date(today.getFullYear(), 0, 1);
      newTo = new Date(today.getFullYear(), 11, 31);
    } else {
      newFrom = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    }

    handleFilter(formatLocalDateString(newFrom), formatLocalDateString(newTo));
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-end gap-4">
        {/* Date inputs */}
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs text-gray-500">
              {t("filters.from")}
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => handleFilter(e.target.value, to)}
              className="h-9 w-36"
            />
          </div>
          <span className="pb-2 text-gray-400">-</span>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs text-gray-500">
              {t("filters.to")}
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => handleFilter(from, e.target.value)}
              className="h-9 w-36"
            />
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter(7)}
            className="h-9 text-xs"
          >
            {t("filters.last7Days")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter(30)}
            className="h-9 text-xs"
          >
            {t("filters.last30Days")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter("month")}
            className="h-9 text-xs"
          >
            {t("filters.thisMonth")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter("year")}
            className="h-9 text-xs"
          >
            {t("filters.thisYear")}
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{t("filters.period")}</span>
        </div>
      </div>
    </div>
  );
}
