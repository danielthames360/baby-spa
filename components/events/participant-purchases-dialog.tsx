"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ShoppingBag,
  Loader2,
  Package,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/currency-utils";

interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
}

interface ParticipantPurchasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  participantId: string;
  participantName: string;
}

export function ParticipantPurchasesDialog({
  open,
  onOpenChange,
  eventId,
  participantId,
  participantName,
}: ParticipantPurchasesDialogProps) {
  const t = useTranslations("events");
  const locale = useLocale();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchPurchases = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/events/${eventId}/participants/${participantId}/purchases`
          );
          if (response.ok) {
            const data = await response.json();
            setPurchases(data.purchases || []);
            setTotal(data.total || 0);
          }
        } catch (error) {
          console.error("Error fetching purchases:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPurchases();
    }
  }, [open, eventId, participantId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            {t("sales.purchasedProducts")}
          </DialogTitle>
          <p className="text-sm text-gray-500">{participantName}</p>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">{t("sales.noPurchases")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {purchase.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {purchase.quantity} x {formatCurrency(purchase.unitPrice, locale)}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(purchase.total, locale)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-purple-50 p-4">
                <span className="font-medium text-gray-700">Total</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(total, locale)}
                </span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
