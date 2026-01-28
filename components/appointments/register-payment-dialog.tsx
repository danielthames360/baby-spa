"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Check, AlertCircle } from "lucide-react";
import {
  SplitPaymentForm,
  type PaymentDetailInput,
} from "@/components/payments/split-payment-form";

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: Date;
    startTime: string;
    baby?: {
      id: string;
      name: string;
    } | null;
    parent?: {
      id: string;
      name: string;
    } | null;
    selectedPackage?: {
      id: string;
      name: string;
      basePrice?: number | string | null;
      advancePaymentAmount?: number | string | null;
    } | null;
    packagePurchase?: {
      id: string;
      package: {
        id: string;
        name: string;
        basePrice?: number | string | null;
        advancePaymentAmount?: number | string | null;
      };
    } | null;
  };
  onPaymentRegistered: () => void;
}

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  appointment,
  onPaymentRegistered,
}: RegisterPaymentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get package info
  const pkg = appointment.packagePurchase?.package || appointment.selectedPackage;
  const packagePrice = pkg?.basePrice ? parseFloat(pkg.basePrice.toString()) : 0;
  const advanceAmount = pkg?.advancePaymentAmount
    ? parseFloat(pkg.advancePaymentAmount.toString())
    : 0;

  // Use advance amount as default, fall back to package price
  const totalAmount = advanceAmount > 0 ? advanceAmount : packagePrice;

  // Format date using utility to avoid timezone issues
  const formatDate = () => {
    return formatDateForDisplay(appointment.date, locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handlePaymentDetailsChange = useCallback(
    (details: PaymentDetailInput[]) => {
      setPaymentDetails(details);
    },
    []
  );

  const handleSubmit = async () => {
    if (paymentDetails.length === 0) {
      setError(t("payment.split.errors.atleastone"));
      return;
    }

    const totalPaid = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
    if (advanceAmount > 0 && totalPaid < advanceAmount) {
      setError(t("payment.errors.belowMinimum", { amount: advanceAmount }));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointment-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          amount: totalPaid,
          paymentType: "ADVANCE",
          paymentDetails,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        onPaymentRegistered();
        onOpenChange(false);
        // Reset form
        setPaymentDetails([]);
        setNotes("");
      } else {
        const data = await response.json();
        if (data.error === "AMOUNT_BELOW_MINIMUM") {
          setError(t("payment.errors.belowMinimum", { amount: data.minimum }));
        } else {
          setError(t("payment.errors.generic"));
        }
      }
    } catch (err) {
      console.error("Error registering payment:", err);
      setError(t("payment.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = paymentDetails.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <CreditCard className="h-5 w-5 text-teal-600" />
            {t("payment.registerPayment")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment info */}
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {appointment.baby
                  ? t("common.baby")
                  : t("calendar.clientType.parent")}
                :
              </span>
              <span className="font-medium text-gray-800">
                {appointment.baby?.name || appointment.parent?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("common.date")}:</span>
              <span className="font-medium text-gray-800">
                {formatDate()} - {appointment.startTime.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("common.package")}:</span>
              <span className="font-medium text-gray-800">
                {pkg?.name || "-"}
              </span>
            </div>
            {packagePrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("payment.totalPrice")}:</span>
                <span className="font-medium text-gray-800">
                  Bs. {packagePrice}
                </span>
              </div>
            )}
            {advanceAmount > 0 && (
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                <span className="text-amber-600 font-medium">
                  {t("payment.advanceRequired")}:
                </span>
                <span className="font-bold text-amber-700">
                  Bs. {advanceAmount}
                </span>
              </div>
            )}
          </div>

          {/* Split Payment Form */}
          <SplitPaymentForm
            totalAmount={totalAmount}
            onPaymentDetailsChange={handlePaymentDetailsChange}
            disabled={isSubmitting}
            showReference={true}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("calendar.notes")}{" "}
              <span className="text-gray-400">({t("payment.optional")})</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl border-2 border-teal-100 focus:border-teal-400 min-h-[60px]"
            />
          </div>

          {/* Warning message */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              {t("payment.confirmationWarning")}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {t("payment.confirmPayment")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
