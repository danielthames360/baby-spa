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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCashRegister } from "@/hooks/use-cash-register";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CloseCashRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseCashRegisterModal({
  open,
  onOpenChange,
}: CloseCashRegisterModalProps) {
  const t = useTranslations("cashRegister");
  const locale = useLocale();
  const { closeCashRegister } = useCashRegister();

  const [declaredAmount, setDeclaredAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(declaredAmount);

    if (isNaN(amount) || amount < 0) {
      toast.error(t("closeModal.errorInvalidAmount"));
      return;
    }

    try {
      setIsSubmitting(true);
      await closeCashRegister(amount, closingNotes || undefined);
      setShowSuccess(true);
    } catch {
      toast.error(t("closeModal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setDeclaredAmount("");
      setClosingNotes("");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onOpenChange(false);
    setDeclaredAmount("");
    setClosingNotes("");
  };

  return (
    <>
      <Dialog open={open && !showSuccess} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              {t("closeModal.title")}
            </DialogTitle>
            <DialogDescription>
              {t("closeModal.instruction")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="declaredAmount">
                {t("closeModal.declaredAmount")}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {getCurrencySymbol(locale)}
                </span>
                <Input
                  id="declaredAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(e.target.value)}
                  className="pl-10 text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingNotes">{t("closeModal.notes")}</Label>
              <Textarea
                id="closingNotes"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder={t("closeModal.notesPlaceholder")}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("closeModal.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !declaredAmount}
              variant="destructive"
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {t("closeModal.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success confirmation dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              {t("closedSuccess.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("closedSuccess.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleSuccessClose}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              {t("closedSuccess.understood")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
