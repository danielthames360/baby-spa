"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Ban,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoidedTransaction {
  id: string;
  category: string;
  referenceType: string;
  referenceId: string;
  total: number;
  paymentMethods: { method: string; amount: number }[];
  createdAt: string;
  createdBy: { id: string; name: string } | null;
  voidedAt: string;
  voidedBy: { id: string; name: string } | null;
  voidReason: string | null;
  items: {
    id: string;
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    finalPrice: number;
  }[];
}

interface VoidSummary {
  totalVoids: number;
  totalAmount: number;
  byCategory: Record<string, number>;
}

export default function VoidsHistoryPage() {
  const t = useTranslations("transactions.history");
  const tTx = useTranslations("transactions");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<VoidedTransaction[]>([]);
  const [summary, setSummary] = useState<VoidSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const currencyLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";
  const limit = 20;

  // Redirect if not authorized
  useEffect(() => {
    if (session && session.user?.role !== "OWNER" && session.user?.role !== "ADMIN") {
      router.push(`/${locale}/admin/dashboard`);
    }
  }, [session, router, locale]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const response = await fetch(`/api/transactions/voids?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotal(data.total);
        setSummary(data.summary);
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, categoryFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const getCategoryLabel = (category: string) => {
    try {
      return tTx(`categories.${category}`);
    } catch {
      return category;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          <Ban className="h-8 w-8 text-rose-500" />
          {t("title")}
        </h1>
        <p className="mt-1 text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">
            <Calendar className="mr-1 inline h-3 w-3" />
            {t("dateVoided")}
          </label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 w-40"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 w-40"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">
            <Filter className="mr-1 inline h-3 w-3" />
            {t("filterByType")}
          </label>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTypes")}</SelectItem>
              <SelectItem value="APPOINTMENT_ADVANCE">{getCategoryLabel("APPOINTMENT_ADVANCE")}</SelectItem>
              <SelectItem value="SESSION">{getCategoryLabel("SESSION")}</SelectItem>
              <SelectItem value="EVENT_REGISTRATION">{getCategoryLabel("EVENT_REGISTRATION")}</SelectItem>
              <SelectItem value="EVENT_PRODUCTS">{getCategoryLabel("EVENT_PRODUCTS")}</SelectItem>
              <SelectItem value="ADMIN_EXPENSE">{getCategoryLabel("ADMIN_EXPENSE")}</SelectItem>
              <SelectItem value="STAFF_PAYMENT">{getCategoryLabel("STAFF_PAYMENT")}</SelectItem>
              <SelectItem value="BABY_CARD">{getCategoryLabel("BABY_CARD")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      {summary && summary.totalVoids > 0 && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-5 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("summary")}</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400">{t("totalVoids")}</p>
              <p className="text-2xl font-bold text-gray-700">{summary.totalVoids}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{t("totalAmount")}</p>
              <p className="text-2xl font-bold text-rose-600">
                {formatCurrency(summary.totalAmount, currencyLocale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{t("byType")}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {Object.entries(summary.byCategory).map(([cat, count]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {getCategoryLabel(cat)} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Ban className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">{t("noVoids")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id}>
                <div
                  className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-teal-50/50"
                  onClick={() =>
                    setExpandedId(expandedId === tx.id ? null : tx.id)
                  }
                >
                  {/* Date */}
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-medium text-gray-700">
                      {formatDateForDisplay(tx.voidedAt, dateLocale, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateForDisplay(tx.voidedAt, dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Category */}
                  <div className="w-36 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(tx.category)}
                    </Badge>
                  </div>

                  {/* Items summary */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-600">
                      {tx.items.map((i) => i.description).join(", ") || tx.referenceType}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="w-28 shrink-0 text-right">
                    <p className="text-sm font-bold text-rose-600">
                      {formatCurrency(tx.total, currencyLocale)}
                    </p>
                  </div>

                  {/* Voided by */}
                  <div className="w-28 shrink-0">
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      {tx.voidedBy?.name || "—"}
                    </p>
                  </div>

                  {/* Expand */}
                  <div className="shrink-0">
                    {expandedId === tx.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === tx.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400">{t("reason")}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {tx.voidReason || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">{t("originalDate")}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {formatDateForDisplay(tx.createdAt, dateLocale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tx.createdBy?.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          {t("voidedBy")}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {tx.voidedBy?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateForDisplay(tx.voidedAt, dateLocale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    {tx.items.length > 0 && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <p className="mb-2 text-xs font-medium text-gray-400">Items</p>
                        <div className="space-y-1">
                          {tx.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-600">
                                {item.quantity > 1
                                  ? `${item.quantity}x `
                                  : ""}
                                {item.description}
                              </span>
                              <span className="font-medium text-gray-700">
                                {formatCurrency(item.finalPrice, currencyLocale)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            &larr;
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
