"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Package,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Edit,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PackageFormDialog } from "@/components/packages/package-form-dialog";
import { PACKAGE_CATEGORIES } from "@/lib/constants";

interface PackageItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sessionCount: number;
  basePrice: number | string;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    purchases: number;
  };
}

export default function PackagesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter packages by category
  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "uncategorized") return !pkg.category;
    return pkg.category === selectedCategory;
  });

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/packages?includeInactive=true");
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleToggleActive = async (pkg: PackageItem) => {
    setTogglingId(pkg.id);
    try {
      const response = await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        fetchPackages();
      }
    } catch (error) {
      console.error("Error toggling package status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (pkg: PackageItem) => {
    setSelectedPackage(pkg);
    setShowDialog(true);
  };

  const handleCreate = () => {
    setSelectedPackage(null);
    setShowDialog(true);
  };

  const handleDialogSuccess = () => {
    fetchPackages();
  };

  const getPackageName = (pkg: PackageItem) => {
    return pkg.name;
  };

  const formatPrice = (price: number | string) => {
    const numPrice = Number(price);
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(numPrice);
  };

  // Color gradients for different package sizes
  const getPackageColors = (sessionCount: number) => {
    if (sessionCount === 1) {
      return {
        gradient: "from-gray-400 to-gray-500",
        shadow: "shadow-gray-200",
        bg: "from-gray-50 to-gray-100",
        text: "text-gray-600",
      };
    } else if (sessionCount <= 4) {
      return {
        gradient: "from-teal-400 to-cyan-500",
        shadow: "shadow-teal-200",
        bg: "from-teal-50 to-cyan-50",
        text: "text-teal-600",
      };
    } else if (sessionCount <= 8) {
      return {
        gradient: "from-cyan-500 to-blue-500",
        shadow: "shadow-cyan-200",
        bg: "from-cyan-50 to-blue-50",
        text: "text-cyan-600",
      };
    } else if (sessionCount <= 10) {
      return {
        gradient: "from-violet-500 to-purple-500",
        shadow: "shadow-violet-200",
        bg: "from-violet-50 to-purple-50",
        text: "text-violet-600",
      };
    } else {
      return {
        gradient: "from-amber-400 to-orange-500",
        shadow: "shadow-amber-200",
        bg: "from-amber-50 to-orange-50",
        text: "text-amber-600",
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("packages.title")}
          </h1>
          <p className="mt-1 text-gray-500">{t("packages.subtitle")}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t("packages.newPackage")}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
              : "bg-white/70 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          {t("packages.categories.all")}
        </button>
        {PACKAGE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === category
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                : "bg-white/70 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
            }`}
          >
            {t(`packages.categories.${category}`)}
          </button>
        ))}
        <button
          onClick={() => setSelectedCategory("uncategorized")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === "uncategorized"
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md"
              : "bg-white/70 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          {t("packages.categories.uncategorized")}
        </button>
      </div>

      {/* Package Form Dialog */}
      <PackageFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        package={selectedPackage}
        onSuccess={handleDialogSuccess}
      />

      {/* Package Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredPackages.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => {
            const colors = getPackageColors(pkg.sessionCount);
            const isToggling = togglingId === pkg.id;

            return (
              <Card
                key={pkg.id}
                className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  !pkg.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Decorative top bar */}
                <div
                  className={`h-2 w-full bg-gradient-to-r ${colors.gradient}`}
                />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors.bg}`}
                      >
                        <Package className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {getPackageName(pkg)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gradient-to-r ${colors.gradient} text-white`}
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            {t("packages.sessionCount", {
                              count: pkg.sessionCount,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        pkg.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {pkg.isActive
                        ? t("packages.active")
                        : t("packages.inactive")}
                    </span>
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="mt-4 text-sm text-gray-500 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-800">
                      {formatPrice(pkg.basePrice)}
                    </span>
                  </div>

                  {/* Stats */}
                  {pkg._count && pkg._count.purchases > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {t("packages.purchasesCount", {
                        count: pkg._count.purchases,
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(pkg)}
                      className="flex-1 h-9 rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
                    >
                      <Edit className="mr-1.5 h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(pkg)}
                      disabled={isToggling}
                      className={`flex-1 h-9 rounded-xl border-2 ${
                        pkg.isActive
                          ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : pkg.isActive ? (
                        <ToggleRight className="mr-1.5 h-4 w-4" />
                      ) : (
                        <ToggleLeft className="mr-1.5 h-4 w-4" />
                      )}
                      {pkg.isActive
                        ? t("packages.deactivate")
                        : t("packages.activate")}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <Package className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-600">
              {t("packages.empty")}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {t("packages.emptyDescription")}
            </p>
            <Button
              onClick={handleCreate}
              className="mt-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("packages.newPackage")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
