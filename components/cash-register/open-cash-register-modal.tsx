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
import { CircleDollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OpenCashRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenCashRegisterModal({
  open,
  onOpenChange,
}: OpenCashRegisterModalProps) {
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
      toast.success(t("openModal.success"));
      onOpenChange(false);
      setInitialFund("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-teal-600" />
            {t("openModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("openModal.initialFundHelp")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="initialFund">{t("openModal.initialFund")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {getCurrencySymbol(locale)}
              </span>
              <Input
                id="initialFund"
                type="number"
                min="0"
                step="0.01"
                value={initialFund}
                onChange={(e) => setInitialFund(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("openModal.later")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleDollarSign className="h-4 w-4" />
            )}
            {t("openModal.openNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
