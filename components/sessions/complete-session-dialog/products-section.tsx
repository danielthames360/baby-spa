"use client";

import { useTranslations } from "next-intl";
import {
  Check,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Product, SessionProduct } from "./types";

interface ProductsSectionProps {
  sessionProducts: SessionProduct[];
  products: Product[];
  showAddProduct: boolean;
  onToggleAddProduct: () => void;
  selectedProduct: string;
  onSelectProduct: (productId: string) => void;
  productQuantity: number;
  onQuantityChange: (quantity: number) => void;
  productChargeable: boolean;
  onChargeableChange: (chargeable: boolean) => void;
  productSearchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  isAddingProduct: boolean;
  onAddProduct: () => void;
  onRemoveProduct: (sessionProductId: string) => void;
  formatPrice: (price: number) => string;
}

export function ProductsSection({
  sessionProducts,
  products,
  showAddProduct,
  onToggleAddProduct,
  selectedProduct,
  onSelectProduct,
  productQuantity,
  onQuantityChange,
  productChargeable,
  onChargeableChange,
  productSearchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isAddingProduct,
  onAddProduct,
  onRemoveProduct,
  formatPrice,
}: ProductsSectionProps) {
  const t = useTranslations();

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = productSearchQuery
      ? product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
      : true;
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <Package className="h-5 w-5 text-cyan-600" />
          {t("session.productsUsed")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAddProduct}
          className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50 font-medium"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t("session.addProduct")}
        </Button>
      </div>

      {/* Add product form */}
      {showAddProduct && (
        <div className="space-y-3 rounded-xl bg-white p-4 border border-teal-100 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={productSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("session.searchProduct")}
              className="h-10 rounded-xl border-2 border-gray-200 pl-10 focus:border-teal-400"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCategoryChange("all")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  selectedCategory === "all"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t("common.all")}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryChange(category)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    selectedCategory === category
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[150px] overflow-y-auto">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProduct === product.id;
                  const isOutOfStock = product.currentStock < 1;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        !isOutOfStock &&
                        onSelectProduct(isSelected ? "" : product.id)
                      }
                      disabled={isOutOfStock}
                      className={cn(
                        "flex flex-col items-start rounded-lg border-2 p-2.5 text-left transition-all",
                        isSelected
                          ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                          : isOutOfStock
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-1">
                        <span className="text-sm font-medium text-gray-800 line-clamp-1">
                          {product.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 text-teal-600" />
                        )}
                      </div>
                      <div className="flex w-full items-center justify-between mt-1">
                        <span className="text-xs text-teal-600 font-semibold">
                          {formatPrice(Number(product.salePrice))}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            isOutOfStock ? "text-rose-500" : "text-gray-400"
                          )}
                        >
                          Stock: {product.currentStock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">
                {t("common.noResults")}
              </p>
            )}
          </div>

          {selectedProduct && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-500">
                  {t("common.quantity")}:
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={productQuantity}
                  onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                  className="h-9 w-16 rounded-lg border-2 border-gray-200 text-center text-sm font-medium"
                />
              </div>
              <Select
                value={productChargeable ? "yes" : "no"}
                onValueChange={(v) => onChargeableChange(v === "yes")}
              >
                <SelectTrigger className="h-9 flex-1 rounded-lg border-2 border-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t("session.chargeable")}</SelectItem>
                  <SelectItem value="no">{t("session.notChargeable")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onAddProduct}
                disabled={!selectedProduct || isAddingProduct}
                className="h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-4 text-white text-sm font-medium"
              >
                {isAddingProduct ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.add")
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Products list */}
      {sessionProducts.length > 0 ? (
        <div className="space-y-2 max-h-[150px] overflow-y-auto">
          {sessionProducts.map((sp) => (
            <div
              key={sp.id}
              className={cn(
                "flex items-center justify-between rounded-xl p-3 border",
                sp.isChargeable
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-200"
              )}
            >
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {sp.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {sp.quantity} x {formatPrice(parseFloat(sp.unitPrice))}
                  {sp.isChargeable && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {t("session.chargeable")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sp.isChargeable && (
                  <span className="text-sm font-bold text-emerald-600">
                    {formatPrice(parseFloat(sp.unitPrice) * sp.quantity)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProduct(sp.id)}
                  className="h-8 w-8 rounded-full p-0 text-rose-500 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-2">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">{t("session.noProductsAdded")}</p>
        </div>
      )}
    </div>
  );
}
