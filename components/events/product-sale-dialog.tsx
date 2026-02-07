"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useCashRegisterGuard } from "@/hooks/use-cash-register-guard";

// Dynamic import for cash register required modal
const CashRegisterRequiredModal = dynamic(
  () => import("@/components/cash-register/cash-register-required-modal").then(mod => mod.CashRegisterRequiredModal),
  { ssr: false }
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SplitPaymentForm, PaymentDetailInput } from "@/components/payments/split-payment-form";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils/currency-utils";

interface Product {
  id: string;
  name: string;
  salePrice: number | { toString(): string };
  currentStock: number;
  categoryRef?: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface ProductSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  participantId: string;
  participantName: string;
  babyId?: string;
  onSuccess?: () => void;
}

export function ProductSaleDialog({
  open,
  onOpenChange,
  eventId,
  participantId,
  participantName,
  babyId,
  onSuccess,
}: ProductSaleDialogProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");
  const locale = useLocale();
  const currency = getCurrencySymbol(locale);

  // Cash register guard
  const { showCashRegisterModal, setShowCashRegisterModal, handleCashRegisterError, onCashRegisterSuccess } = useCashRegisterGuard();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products and categories
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [productsRes, categoriesRes] = await Promise.all([
            fetch("/api/products?active=true"),
            fetch("/api/categories"),
          ]);
          if (productsRes.ok) {
            const data = await productsRes.json();
            setProducts(data.products || []);
          }
          if (categoriesRes.ok) {
            const data = await categoriesRes.json();
            setCategories(data.categories || []);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedProducts([]);
      setSearchTerm("");
      setSelectedCategory("all");
      setPaymentDetails([]);
    }
  }, [open]);

  // Memoized callback for payment details change
  const handlePaymentDetailsChange = useCallback((details: PaymentDetailInput[]) => {
    setPaymentDetails(details);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        product.categoryRef?.id === selectedCategory;
      return matchesSearch && matchesCategory && product.currentStock > 0;
    });
  }, [products, searchTerm, selectedCategory]);

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.currentStock) {
        setSelectedProducts((prev) =>
          prev.map((p) =>
            p.product.id === product.id
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        );
      }
    } else {
      setSelectedProducts((prev) => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.product.id === productId) {
          const newQuantity = p.quantity + delta;
          if (newQuantity <= 0) return p;
          if (newQuantity > p.product.currentStock) return p;
          return { ...p, quantity: newQuantity };
        }
        return p;
      })
    );
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.product.id !== productId));
  };

  const total = selectedProducts.reduce(
    (sum, p) => sum + Number(p.product.salePrice) * p.quantity,
    0
  );

  const handleSubmit = async () => {
    if (selectedProducts.length === 0 || paymentDetails.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: selectedProducts.map((p) => ({
            productId: p.product.id,
            quantity: p.quantity,
            unitPrice: Number(p.product.salePrice),
          })),
          paymentMethods: paymentDetails.map((pd) => ({
            method: pd.paymentMethod,
            amount: pd.amount,
            reference: pd.reference,
          })),
          babyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check if cash register is required
        if (handleCashRegisterError(errorData.error, handleSubmit)) {
          setIsSubmitting(false);
          return;
        }
        throw new Error(errorData.error || "Error processing sale");
      }

      toast.success(t("sales.saleCompleted"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            {t("sales.sellProduct")}
          </DialogTitle>
          <p className="text-sm text-gray-500">{participantName}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tInventory("searchPlaceholder")}
                className="h-10 rounded-xl border-2 border-purple-100 pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 w-full rounded-xl border-2 border-purple-100 sm:w-36">
                <SelectValue placeholder={tInventory("allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tInventory("allCategories")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product List */}
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-purple-200 bg-purple-50/30 p-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                {tCommon("noResults")}
              </p>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.currentStock <= 5;
                const selected = selectedProducts.find((p) => p.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between rounded-lg p-2 transition-all ${
                      selected ? "bg-purple-100" : "hover:bg-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-800">
                          {product.name}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{product.currentStock} stock</span>
                        <span>•</span>
                        <span className="font-medium text-purple-600">
                          {formatCurrency(Number(product.salePrice), locale)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addProduct(product)}
                      disabled={selected && selected.quantity >= product.currentStock}
                      className="h-8 rounded-lg border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              <Label>{t("sales.selectedProducts")}</Label>
              <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-2">
                {selectedProducts.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(Number(item.product.salePrice), locale)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7"
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
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.currentStock}
                        className="h-7 w-7"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="ml-2 w-20 text-right text-sm font-semibold text-purple-600">
                        {formatCurrency(Number(item.product.salePrice) * item.quantity, locale)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeProduct(item.product.id)}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method with Split Payment Support */}
          {selectedProducts.length > 0 && (
            <SplitPaymentForm
              totalAmount={total}
              onPaymentDetailsChange={handlePaymentDetailsChange}
              showReference={false}
              currency={currency}
            />
          )}

          {/* Submit */}
          {selectedProducts.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedProducts.length === 0 || paymentDetails.length === 0}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-white shadow-lg shadow-purple-300/50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              {t("sales.completeSale")}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Cash Register Required Modal */}
      <CashRegisterRequiredModal
        open={showCashRegisterModal}
        onOpenChange={setShowCashRegisterModal}
        onSuccess={onCashRegisterSuccess}
      />
    </Dialog>
  );
}
