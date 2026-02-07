"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency-utils";

interface VoidTransactionDialogProps {
  transactionId: string;
  transactionSummary: string;
  amount: number;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoided: () => void;
}

export function VoidTransactionDialog({
  transactionId,
  transactionSummary,
  amount,
  locale,
  open,
  onOpenChange,
  onVoided,
}: VoidTransactionDialogProps) {
  const t = useTranslations("transactions.void");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currencyLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";

  const handleVoid = async () => {
    if (reason.trim().length < 10) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error");
      }

      toast.success(t("success"));
      setReason("");
      onOpenChange(false);
      onVoided();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error";
      if (message === "TRANSACTION_ALREADY_VOIDED") {
        toast.error(t("alreadyVoided"));
      } else if (message === "CANNOT_VOID_REVERSAL") {
        toast.error(t("cannotVoidReversal"));
      } else if (message === "TRANSACTION_NOT_FOUND") {
        toast.error(t("notFound"));
      } else if (message === "Forbidden") {
        toast.error(t("noPermission"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Ban className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("confirm")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction summary */}
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-medium text-gray-700">
              {transactionSummary}
            </p>
            <p className="text-lg font-bold text-rose-600">
              {formatCurrency(amount, currencyLocale)}
            </p>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="void-reason">{t("reason")}</Label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="min-h-[80px]"
              maxLength={500}
            />
            {reason.length > 0 && reason.trim().length < 10 && (
              <p className="text-xs text-rose-500">{t("reasonRequired")}</p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">{t("warning")}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={isLoading || reason.trim().length < 10}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {t("button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
