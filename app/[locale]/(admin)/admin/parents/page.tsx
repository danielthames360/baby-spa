"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Search,
  Plus,
  UserRound,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Heart,
  Baby,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParentCard } from "@/components/parents/parent-card";

// bundle-dynamic-imports: Lazy load dialog to reduce initial bundle
const ParentDialog = dynamic(
  () =>
    import("@/components/parents/parent-dialog").then((m) => m.ParentDialog),
  { ssr: false }
);

interface ParentListItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  pregnancyWeeks: number | null;
  babies: {
    baby: {
      id: string;
      name: string;
    };
  }[];
}

interface Counts {
  all: number;
  withBabies: number;
  leads: number;
}

type FilterStatus = "all" | "withBabies" | "leads";

export default function ParentsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Counts>({ all: 0, withBabies: 0, leads: 0 });
  const [showDialog, setShowDialog] = useState(false);

  const fetchParents = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: filter,
      });

      if (search) {
        searchParams.set("search", search);
      }

      const response = await fetch(`/api/parents?${searchParams.toString()}`);
      const data = await response.json();

      setParents(data.parents || []);
      setTotalPages(data.totalPages || 1);
      setCounts(data.counts || { all: 0, withBabies: 0, leads: 0 });
    } catch (error) {
      console.error("Error fetching parents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParents();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchParents]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const filterButtons: { key: FilterStatus; icon: React.ElementType; color: string }[] = [
    { key: "all", icon: UserRound, color: "teal" },
    { key: "withBabies", icon: Baby, color: "cyan" },
    { key: "leads", icon: Heart, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("parents.title")}
          </h1>
          <p className="mt-1 text-gray-500">{t("parents.subtitle")}</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t("parents.newParent")}
        </Button>
      </div>

      {/* Parent Dialog */}
      <ParentDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={fetchParents}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {filterButtons.map(({ key, icon: Icon, color }) => {
          const isActive = filter === key;
          const count = counts[key];

          return (
            <Card
              key={key}
              onClick={() => setFilter(key)}
              className={`cursor-pointer rounded-2xl border-2 p-4 shadow-lg transition-all ${
                isActive
                  ? `border-${color}-400 bg-${color}-50/70 shadow-${color}-500/20`
                  : "border-white/50 bg-white/70 shadow-teal-500/10 hover:border-teal-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    key === "leads"
                      ? "bg-gradient-to-br from-pink-100 to-rose-100"
                      : "bg-gradient-to-br from-teal-100 to-cyan-100"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      key === "leads" ? "text-pink-500" : "text-teal-600"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t(`parents.filters.${key}`)}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                </div>
                {isActive && (
                  <Badge
                    className={`ml-auto ${
                      key === "leads"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {t("common.selected") || "Activo"}
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
          <Input
            type="text"
            placeholder={t("parents.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-xl border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
          />
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : parents.length > 0 ? (
        <div className="space-y-3">
          {parents.map((parent) => (
            <ParentCard key={parent.id} parent={parent} locale={locale} />
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <UserRound className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-600">
              {search
                ? t("common.noResults")
                : filter === "leads"
                  ? "No hay LEADs registrados"
                  : "No hay padres registrados"}
            </h3>
            {!search && (
              <Button
                onClick={() => setShowDialog(true)}
                className="mt-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("parents.newParent")}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-10 w-10 rounded-xl border-2 border-teal-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-10 w-10 rounded-xl border-2 border-teal-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
