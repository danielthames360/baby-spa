"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Package, Plus, Minus, X, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface ProductForSelector {
  id: string;
  name: string;
  category: string | null;
  salePrice: number | string;
  currentStock: number;
  isChargeableByDefault: boolean;
}

export interface SelectedProduct {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isChargeable: boolean;
}

interface ProductSelectorProps {
  products: ProductForSelector[];
  selectedProducts: SelectedProduct[];
  onChange: (products: SelectedProduct[]) => void;
  disabled?: boolean;
}

export function ProductSelector({
  products,
  selectedProducts,
  onChange,
  disabled = false,
}: ProductSelectorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getProductName = (product: ProductForSelector) => {
    return product.name;
  };

  const addProduct = (product: ProductForSelector) => {
    const existing = selectedProducts.find((p) => p.productId === product.id);

    if (existing) {
      // Increase quantity if already selected
      if (existing.quantity < product.currentStock) {
        onChange(
          selectedProducts.map((p) =>
            p.productId === product.id
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        );
      }
    } else {
      // Add new product
      onChange([
        ...selectedProducts,
        {
          productId: product.id,
          name: getProductName(product),
          quantity: 1,
          unitPrice: Number(product.salePrice),
          isChargeable: product.isChargeableByDefault,
        },
      ]);
    }
  };

  const removeProduct = (productId: string) => {
    onChange(selectedProducts.filter((p) => p.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    onChange(
      selectedProducts.map((p) => {
        if (p.productId === productId) {
          const newQuantity = Math.max(1, Math.min(product.currentStock, p.quantity + delta));
          return { ...p, quantity: newQuantity };
        }
        return p;
      })
    );
  };

  const toggleChargeable = (productId: string) => {
    onChange(
      selectedProducts.map((p) =>
        p.productId === productId ? { ...p, isChargeable: !p.isChargeable } : p
      )
    );
  };

  const totalChargeable = selectedProducts
    .filter((p) => p.isChargeable)
    .reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("inventory.searchPlaceholder")}
          disabled={disabled}
          className="h-10 w-full rounded-xl border-2 border-teal-100 pl-10 pr-4 text-sm transition-all focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:bg-gray-100"
        />
      </div>

      {/* Product list */}
      <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-gray-100 p-2">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">
            {t("common.noResults")}
          </p>
        ) : (
          filteredProducts.map((product) => {
            const isSelected = selectedProducts.some((p) => p.productId === product.id);
            const selectedItem = selectedProducts.find((p) => p.productId === product.id);
            const isLowStock = product.currentStock <= 5;
            const maxQuantityReached = selectedItem && selectedItem.quantity >= product.currentStock;

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between rounded-lg p-2 transition-all ${
                  isSelected
                    ? "bg-teal-50 border border-teal-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {getProductName(product)}
                    </span>
                    {isLowStock && (
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {product.category && (
                      <span>{t(`inventory.categories.${product.category}`)}</span>
                    )}
                    <span>•</span>
                    <span>{product.currentStock} en stock</span>
                    <span>•</span>
                    <span>{Number(product.salePrice).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? "secondary" : "outline"}
                  onClick={() => addProduct(product)}
                  disabled={disabled || (isSelected && maxQuantityReached) || product.currentStock === 0}
                  className="h-8 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {t("session.products")}
          </h4>
          <div className="space-y-2">
            {selectedProducts.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const total = item.quantity * item.unitPrice;

              return (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-xl bg-white border border-gray-200 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </span>
                      {item.isChargeable && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {total.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {item.unitPrice.toFixed(2)} c/u
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <Switch
                          checked={item.isChargeable}
                          onCheckedChange={() => toggleChargeable(item.productId)}
                          disabled={disabled}
                          className="scale-75"
                        />
                        Cobrar
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(item.productId, -1)}
                      disabled={disabled || item.quantity <= 1}
                      className="h-7 w-7 rounded-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(item.productId, 1)}
                      disabled={disabled || (product && item.quantity >= product.currentStock)}
                      className="h-7 w-7 rounded-lg"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeProduct(item.productId)}
                      disabled={disabled}
                      className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total chargeable */}
          {totalChargeable > 0 && (
            <div className="flex justify-between items-center rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-medium text-emerald-700">
                Total productos cobrables:
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {totalChargeable.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
