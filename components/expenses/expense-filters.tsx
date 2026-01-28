"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

// Constants outside component
const EXPENSE_CATEGORIES = [
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "MAINTENANCE",
  "MARKETING",
  "TAXES",
  "INSURANCE",
  "EQUIPMENT",
  "OTHER",
] as const;

interface ExpenseFiltersProps {
  locale: string;
  initialFilters: {
    category?: string;
    from?: string;
    to?: string;
  };
}

export function ExpenseFilters({
  locale,
  initialFilters,
}: ExpenseFiltersProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(initialFilters.category || "");
  const [from, setFrom] = useState(initialFilters.from || "");
  const [to, setTo] = useState(initialFilters.to || "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);

    // Clear page when filters change
    params.delete("page");

    // Set or delete each filter
    if (category) params.set("category", category);
    else params.delete("category");

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    router.push(`/${locale}/admin/expenses?${params.toString()}`);
  }, [locale, router, searchParams, category, from, to]);

  const clearFilters = useCallback(() => {
    setCategory("");
    setFrom("");
    setTo("");
    router.push(`/${locale}/admin/expenses`);
  }, [locale, router]);

  const hasFilters = category || from !== initialFilters.from || to !== initialFilters.to;

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category Filter */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.category")} />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder={t("filters.from")}
        />

        {/* Date To */}
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={t("filters.to")}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              {tCommon("clear")}
            </Button>
          )}
          <Button onClick={applyFilters} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            {tCommon("filter")}
          </Button>
        </div>
      </div>
    </div>
  );
}
