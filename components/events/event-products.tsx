"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ProductUsage {
  id: string;
  quantity: number;
  unitPrice: string | number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Product {
  id: string;
  name: string;
  unit: string;
  sellingPrice: string | number;
  stock: number;
}

interface EventProductsProps {
  eventId: string;
  productUsages: ProductUsage[];
  canEdit: boolean;
  onUpdate: () => void;
}

export function EventProducts({
  eventId,
  productUsages,
  canEdit,
  onUpdate,
}: EventProductsProps) {
  const t = useTranslations("events");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products/selector");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    fetchProducts();
    setSelectedProductId("");
    setQuantity(1);
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error adding product");
      }

      toast.success(t("products.added"));
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProduct = async (usageId: string) => {
    setDeletingId(usageId);
    try {
      const response = await fetch(`/api/events/${eventId}/products/${usageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error removing product");
      }

      toast.success(t("products.removed"));
      onUpdate();
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCost = productUsages.reduce((sum, usage) => {
    return sum + Number(usage.unitPrice) * usage.quantity;
  }, 0);

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Package className="h-5 w-5 text-teal-600" />
          {t("products.title")}
        </h3>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDialog}
                className="border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("products.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("products.addProduct")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t("products.selectProduct")}
                      </label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("products.selectProduct")} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{product.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({product.stock} {product.unit})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t("products.quantity")}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={handleAddProduct}
                        disabled={!selectedProductId || isSubmitting}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("products.add")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {productUsages.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          {t("products.noProducts")}
        </p>
      ) : (
        <div className="space-y-2">
          {productUsages.map((usage) => (
            <div
              key={usage.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
            >
              <div>
                <p className="font-medium text-gray-700">{usage.product.name}</p>
                <p className="text-sm text-gray-500">
                  {usage.quantity} {usage.product.unit} × Bs. {Number(usage.unitPrice).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700">
                  Bs. {(Number(usage.unitPrice) * usage.quantity).toFixed(2)}
                </span>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveProduct(usage.id)}
                    disabled={deletingId === usage.id}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    {deletingId === usage.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="font-medium text-gray-600">{t("products.total")}:</span>
            <span className="text-lg font-bold text-teal-600">
              Bs. {totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
