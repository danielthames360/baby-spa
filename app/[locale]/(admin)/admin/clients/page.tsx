"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  Baby,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BabyCard } from "@/components/babies/baby-card";
import { CreateRegistrationLinkDialog } from "@/components/registration/create-link-dialog";

interface BabyListItem {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  isActive: boolean;
  parents: {
    relationship: string;
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string;
    };
  }[];
  packagePurchases: {
    remainingSessions: number;
    isActive: boolean;
    package: {
      name: string;
      namePortuguese: string | null;
    };
  }[];
  _count: {
    sessions: number;
  };
}

export default function ClientsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [babies, setBabies] = useState<BabyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "withPackage" | "withoutPackage">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const fetchBabies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: "active",
      });

      if (search) {
        params.set("search", search);
      }

      if (filter === "withPackage") {
        params.set("hasActivePackage", "true");
      } else if (filter === "withoutPackage") {
        params.set("hasActivePackage", "false");
      }

      const response = await fetch(`/api/babies?${params.toString()}`);
      const data = await response.json();

      setBabies(data.babies || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching babies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBabies();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchBabies]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("clients.title")}
          </h1>
          <p className="mt-1 text-gray-500">{t("clients.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowLinkDialog(true)}
            variant="outline"
            className="h-12 rounded-xl border-2 border-teal-200 px-4 font-medium text-teal-600 transition-all hover:bg-teal-50 hover:text-teal-700"
          >
            <Link2 className="mr-2 h-5 w-5" />
            {t("clients.createLink")}
          </Button>
          <Link href={`/${locale}/admin/clients/new`}>
            <Button className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40">
              <Plus className="mr-2 h-5 w-5" />
              {t("clients.newBaby")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Registration Link Dialog */}
      <CreateRegistrationLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Baby className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("clients.totalClients")}</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
            <Input
              type="text"
              placeholder={t("clients.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <Select
              value={filter}
              onValueChange={(value) =>
                setFilter(value as "all" | "withPackage" | "withoutPackage")
              }
            >
              <SelectTrigger className="h-12 w-[200px] rounded-xl border-2 border-teal-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("clients.filters.all")}</SelectItem>
                <SelectItem value="withPackage">
                  {t("clients.filters.withPackage")}
                </SelectItem>
                <SelectItem value="withoutPackage">
                  {t("clients.filters.withoutPackage")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : babies.length > 0 ? (
        <div className="space-y-3">
          {babies.map((baby) => (
            <BabyCard key={baby.id} baby={baby} locale={locale} />
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Users className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-600">
              {search ? t("clients.emptySearch") : t("clients.empty")}
            </h3>
            {!search && (
              <p className="mt-1 text-sm text-gray-400">
                {t("clients.emptyDescription")}
              </p>
            )}
            {!search && (
              <Link href={`/${locale}/admin/clients/new`} className="mt-4">
                <Button className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("clients.newBaby")}
                </Button>
              </Link>
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
