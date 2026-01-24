"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
  Package,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Edit,
  Search,
  ShoppingCart,
  Settings2,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic imports for heavy dialog components (reduces initial bundle size)
const ProductFormDialog = dynamic(
  () => import("@/components/inventory/product-form-dialog").then((mod) => mod.ProductFormDialog),
  { ssr: false }
);
const PurchaseDialog = dynamic(
  () => import("@/components/inventory/purchase-dialog").then((mod) => mod.PurchaseDialog),
  { ssr: false }
);
const AdjustStockDialog = dynamic(
  () => import("@/components/inventory/adjust-stock-dialog").then((mod) => mod.AdjustStockDialog),
  { ssr: false }
);
const CategoryManagerDialog = dynamic(
  () => import("@/components/categories/category-manager-dialog").then((mod) => mod.CategoryManagerDialog),
  { ssr: false }
);

interface Category {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryRef?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  costPrice: number | string;
  salePrice: number | string;
  currentStock: number;
  minStock: number;
  isActive: boolean;
  isChargeableByDefault: boolean;
  _count?: {
    movements: number;
  };
}

type StockFilter = "all" | "low" | "out";

export default function InventoryPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  // Dialog states
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?type=PRODUCT");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("includeInactive", "true");

      if (searchTerm) {
        params.set("search", searchTerm);
      }
      if (categoryFilter !== "all") {
        params.set("categoryId", categoryFilter);
      }
      if (stockFilter === "low") {
        params.set("lowStock", "true");
      } else if (stockFilter === "out") {
        params.set("outOfStock", "true");
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, stockFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchProducts, searchTerm]);

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.id);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setShowProductDialog(true);
  };

  const handlePurchase = (product?: Product) => {
    setSelectedProduct(product || null);
    setShowPurchaseDialog(true);
  };

  const handleAdjust = (product: Product) => {
    setSelectedProduct(product);
    setShowAdjustDialog(true);
  };

  const handleDialogSuccess = () => {
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  const hasActiveFilters =
    searchTerm !== "" || categoryFilter !== "all" || stockFilter !== "all";

  const getProductName = (product: Product) => {
    return product.name;
  };

  const formatPrice = (price: number | string) => {
    const numPrice = Number(price);
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(numPrice);
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { label: t("inventory.outOfStock"), variant: "destructive" as const };
    }
    if (product.currentStock <= product.minStock) {
      return { label: t("inventory.lowStock"), variant: "warning" as const };
    }
    return { label: t("inventory.inStock"), variant: "success" as const };
  };

  const getCategoryColors = (color: string | null | undefined) => {
    // Use category color if available, otherwise default
    const colorMap: Record<string, { gradient: string; bg: string; text: string }> = {
      blue: {
        gradient: "from-blue-400 to-indigo-500",
        bg: "from-blue-50 to-indigo-50",
        text: "text-blue-600",
      },
      amber: {
        gradient: "from-amber-400 to-yellow-500",
        bg: "from-amber-50 to-yellow-50",
        text: "text-amber-600",
      },
      pink: {
        gradient: "from-pink-400 to-rose-500",
        bg: "from-pink-50 to-rose-50",
        text: "text-pink-600",
      },
      cyan: {
        gradient: "from-cyan-400 to-teal-500",
        bg: "from-cyan-50 to-teal-50",
        text: "text-cyan-600",
      },
      violet: {
        gradient: "from-violet-400 to-purple-500",
        bg: "from-violet-50 to-purple-50",
        text: "text-violet-600",
      },
      emerald: {
        gradient: "from-emerald-400 to-teal-500",
        bg: "from-emerald-50 to-teal-50",
        text: "text-emerald-600",
      },
      rose: {
        gradient: "from-rose-400 to-pink-500",
        bg: "from-rose-50 to-pink-50",
        text: "text-rose-600",
      },
      orange: {
        gradient: "from-orange-400 to-amber-500",
        bg: "from-orange-50 to-amber-50",
        text: "text-orange-600",
      },
    };

    return colorMap[color || ""] || {
      gradient: "from-gray-400 to-gray-500",
      bg: "from-gray-50 to-gray-100",
      text: "text-gray-600",
    };
  };

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStock
  ).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("inventory.title")}
          </h1>
          <p className="mt-1 text-gray-500">{t("inventory.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handlePurchase()}
            variant="outline"
            className="h-12 rounded-xl border-2 border-emerald-200 px-4 font-medium text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {t("inventory.registerPurchase")}
          </Button>
          <Button
            onClick={handleCreate}
            className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t("inventory.newProduct")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Package className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("inventory.stats.totalProducts")}</p>
              <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
            </div>
          </div>
        </Card>
        <Card
          className={`rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:-translate-y-1 ${
            stockFilter === "low" ? "ring-2 ring-amber-400" : ""
          }`}
          onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("inventory.stats.lowStock")}</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>
        </Card>
        <Card
          className={`rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:-translate-y-1 ${
            stockFilter === "out" ? "ring-2 ring-rose-400" : ""
          }`}
          onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-100">
              <Package className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("inventory.stats.outOfStock")}</p>
              <p className="text-2xl font-bold text-rose-600">{outOfStockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("inventory.searchPlaceholder")}
              className="h-11 w-full rounded-xl border-2 border-teal-100 pl-10 pr-4 transition-all focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 w-full sm:w-[180px] rounded-xl border-2 border-teal-100">
                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder={t("inventory.filterByCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inventory.allCategories")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowCategoryManager(true)}
              className="h-11 rounded-xl border-2 border-teal-100 text-teal-600 hover:bg-teal-50"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-11 rounded-xl text-gray-500 hover:text-gray-700"
            >
              <X className="mr-2 h-4 w-4" />
              {t("common.clearFilters")}
            </Button>
          )}
        </div>
      </Card>

      {/* Dialogs */}
      <ProductFormDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        product={selectedProduct}
        onSuccess={handleDialogSuccess}
      />

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        products={products.filter((p) => p.isActive)}
        selectedProductId={selectedProduct?.id}
        onSuccess={handleDialogSuccess}
      />

      <AdjustStockDialog
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        product={selectedProduct}
        onSuccess={handleDialogSuccess}
      />

      <CategoryManagerDialog
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
        type="PRODUCT"
        onCategoriesChange={fetchCategories}
      />

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const colors = getCategoryColors(product.categoryRef?.color);
            const stockStatus = getStockStatus(product);
            const isToggling = togglingId === product.id;

            return (
              <Card
                key={product.id}
                className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  !product.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Decorative top bar */}
                <div
                  className={`h-2 w-full bg-gradient-to-r ${colors.gradient}`}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colors.bg}`}
                      >
                        <Package className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {getProductName(product)}
                        </h3>
                        {product.categoryRef && (
                          <p className="text-xs text-gray-500">
                            {product.categoryRef.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-col gap-1 items-end">
                      <Badge
                        variant={stockStatus.variant === "success" ? "default" : stockStatus.variant === "warning" ? "secondary" : "destructive"}
                        className={
                          stockStatus.variant === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : stockStatus.variant === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : ""
                        }
                      >
                        {stockStatus.label}
                      </Badge>
                      {!product.isActive && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          {t("inventory.inactive")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stock info */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">{t("inventory.currentStock")}</p>
                      <p
                        className={`text-lg font-bold ${
                          product.currentStock === 0
                            ? "text-rose-600"
                            : product.currentStock <= product.minStock
                            ? "text-amber-600"
                            : "text-gray-800"
                        }`}
                      >
                        {product.currentStock}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">{t("inventory.salePrice")}</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatPrice(product.salePrice)}
                      </p>
                    </div>
                  </div>

                  {/* Chargeable indicator */}
                  {product.isChargeableByDefault && (
                    <div className="mt-2 text-xs text-gray-400">
                      {t("inventory.chargeableByDefault")}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 h-9 rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
                    >
                      <Edit className="mr-1.5 h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePurchase(product)}
                      className="flex-1 h-9 rounded-xl border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    >
                      <ShoppingCart className="mr-1.5 h-4 w-4" />
                      {t("inventory.purchase.short")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjust(product)}
                      className="flex-1 h-9 rounded-xl border-2 border-amber-200 text-amber-600 hover:bg-amber-50"
                    >
                      <Settings2 className="mr-1.5 h-4 w-4" />
                      {t("inventory.adjustment.short")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      disabled={isToggling}
                      className={`h-9 w-9 rounded-xl border-2 p-0 ${
                        product.isActive
                          ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : product.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
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
              {hasActiveFilters ? t("common.noResults") : t("inventory.empty")}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {hasActiveFilters
                ? t("inventory.noResultsDescription")
                : t("inventory.emptyDescription")}
            </p>
            {!hasActiveFilters && (
              <Button
                onClick={handleCreate}
                className="mt-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("inventory.newProduct")}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
