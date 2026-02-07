"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, CreditCard } from "lucide-react";
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
import { toast } from "sonner";
import {
  SplitPaymentForm,
  type PaymentDetailInput,
} from "@/components/payments/split-payment-form";
import { formatCurrency } from "@/lib/utils/currency-utils";

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  participantId: string;
  participantName: string;
  amountDue: number;
  amountPaid: number;
  onSuccess?: () => void;
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  eventId,
  participantId,
  participantName,
  amountDue,
  amountPaid,
  onSuccess,
}: RegisterPaymentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);

  // Cash register guard
  const { showCashRegisterModal, setShowCashRegisterModal, handleCashRegisterError, onCashRegisterSuccess } = useCashRegisterGuard();

  const pendingAmount = amountDue - amountPaid;

  const handlePaymentDetailsChange = useCallback(
    (details: PaymentDetailInput[]) => {
      setPaymentDetails(details);
    },
    []
  );

  const handleSubmit = async () => {
    if (paymentDetails.length === 0) {
      toast.error(t("payment.split.errors.atleastone"));
      return;
    }

    const totalPaid = paymentDetails.reduce((sum, d) => sum + d.amount, 0);

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/participants/${participantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalPaid,
            paymentDetails,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Check if cash register is required
        if (handleCashRegisterError(errorData.error, handleSubmit)) {
          setIsSubmitting(false);
          return;
        }
        throw new Error(errorData.error || "Error registering payment");
      }

      toast.success(t("events.messages.paymentRegistered"));
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = paymentDetails.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-teal-600" />
            {t("events.payment.registerPayment")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Participant info */}
          <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
            <p className="font-medium text-gray-800">{participantName}</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("events.payment.pending")}</span>
              <span className="font-semibold text-amber-600">
                {formatCurrency(pendingAmount, locale)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("events.payment.alreadyPaid")}</span>
              <span className="font-medium text-emerald-600">
                {formatCurrency(amountPaid, locale)}
              </span>
            </div>
          </div>

          {/* Split Payment Form */}
          <SplitPaymentForm
            totalAmount={pendingAmount}
            onPaymentDetailsChange={handlePaymentDetailsChange}
            disabled={isSubmitting}
            showReference={true}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border-2"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {t("events.payment.register")}
            </Button>
          </div>
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
