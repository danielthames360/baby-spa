"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashRegister } from "@/hooks/use-cash-register";
import { AlertTriangle, CircleDollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CashRegisterRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CashRegisterRequiredModal({
  open,
  onOpenChange,
  onSuccess,
}: CashRegisterRequiredModalProps) {
  const t = useTranslations("cashRegister");
  const locale = useLocale();
  const { openCashRegister } = useCashRegister();

  const [initialFund, setInitialFund] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(initialFund) || 0;

    if (amount < 0) {
      toast.error(t("openModal.errorNegative"));
      return;
    }

    try {
      setIsSubmitting(true);
      await openCashRegister(amount);
      toast.success(t("requiredModal.success"));
      onOpenChange(false);
      setInitialFund("");
      onSuccess?.();
    } catch {
      toast.error(t("openModal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setInitialFund("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            {t("requiredModal.title")}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 pt-2">
            {t("requiredModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="initialFundRequired">
              {t("requiredModal.initialFund")}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {getCurrencySymbol(locale)}
              </span>
              <Input
                id="initialFundRequired"
                type="number"
                min="0"
                step="0.01"
                value={initialFund}
                onChange={(e) => setInitialFund(e.target.value)}
                className="pl-10 h-12 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                placeholder="0.00"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl border-2 border-gray-200"
          >
            {t("requiredModal.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleDollarSign className="h-4 w-4" />
            )}
            {t("requiredModal.openNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
