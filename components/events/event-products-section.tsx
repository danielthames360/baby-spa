"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Package,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// bundle-dynamic-imports: Lazy load dialog
const EventProductUsageDialog = dynamic(
  () => import("./event-product-usage-dialog").then((m) => m.EventProductUsageDialog),
  { ssr: false }
);

interface ProductUsage {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
  };
}

interface EventProductsSectionProps {
  eventId: string;
  eventStatus: string;
}

export function EventProductsSection({
  eventId,
  eventStatus,
}: EventProductsSectionProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [productUsages, setProductUsages] = useState<ProductUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canAddProducts = eventStatus === "IN_PROGRESS";

  // Fetch product usages
  useEffect(() => {
    const fetchUsages = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/products`);
        if (response.ok) {
          const data = await response.json();
          setProductUsages(data.productUsages || []);
        }
      } catch (error) {
        console.error("Error fetching product usages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsages();
  }, [eventId]);

  const handleDeleteUsage = async (usageId: string) => {
    setDeletingId(usageId);
    try {
      const response = await fetch(
        `/api/events/${eventId}/products/${usageId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setProductUsages((prev) => prev.filter((u) => u.id !== usageId));
      toast.success(t("products.removed"));
      router.refresh();
    } catch {
      toast.error("Error removing product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogSuccess = async () => {
    // Refetch usages after adding
    try {
      const response = await fetch(`/api/events/${eventId}/products`);
      if (response.ok) {
        const data = await response.json();
        setProductUsages(data.productUsages || []);
      }
    } catch (error) {
      console.error("Error refetching:", error);
    }
    router.refresh();
  };

  const totalItems = productUsages.reduce((sum, u) => sum + u.quantity, 0);

  return (
    <>
      <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Package className="h-5 w-5 text-purple-600" />
            {t("products.title")}
          </CardTitle>
          {canAddProducts && (
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              {tCommon("add")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : productUsages.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">{t("products.noProducts")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {productUsages.map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-800">
                      {usage.product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-600">
                      x{usage.quantity}
                    </span>
                    {canAddProducts && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUsage(usage.id)}
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
              <div className="flex justify-end border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-500">
                  {t("products.total")}:{" "}
                  <span className="font-bold text-purple-600">
                    {totalItems} items
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Usage Dialog */}
      <EventProductUsageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={eventId}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}
