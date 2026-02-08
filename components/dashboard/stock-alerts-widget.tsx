"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Package, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LowStockProduct {
  id: string;
  name: string;
  category: string | null;
  currentStock: number;
  minStock: number;
}

export function StockAlertsWidget() {
  const t = useTranslations();
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await fetch("/api/products/low-stock?limit=5");
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  const getProductName = (product: LowStockProduct) => {
    return product.name;
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            {t("inventory.alerts.title")}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
            <Package className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            {t("inventory.alerts.title")}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Package className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {t("inventory.alerts.noAlerts")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              {t("inventory.alerts.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {t("inventory.alerts.itemsNeedAttention", { count: products.length })}
            </p>
          </div>
        </div>
        <Link href="/admin/inventory?stockFilter=low">
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            {t("inventory.alerts.viewAll")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 transition-all hover:from-amber-100 hover:to-orange-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/70">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {getProductName(product)}
                </p>
                {product.category && (
                  <p className="text-xs text-gray-500">
                    {t(`inventory.categories.${product.category}`)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant={product.currentStock === 0 ? "destructive" : "secondary"}
                className={
                  product.currentStock === 0
                    ? ""
                    : "bg-amber-100 text-amber-700"
                }
              >
                {product.currentStock === 0
                  ? t("inventory.outOfStock")
                  : `${product.currentStock} / ${product.minStock}`}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
