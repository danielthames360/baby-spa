"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Loader2,
  Check,
  AlertCircle,
  Banknote,
  Building2,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const paymentMethods = [
  { value: "CASH", icon: Banknote, label: "cash" },
  { value: "TRANSFER", icon: Building2, label: "transfer" },
  { value: "OTHER", icon: QrCode, label: "qr" },
  { value: "CARD", icon: CreditCard, label: "card" },
];

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  appointment,
  onPaymentRegistered,
}: RegisterPaymentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get package info
  const pkg = appointment.packagePurchase?.package || appointment.selectedPackage;
  const packagePrice = pkg?.basePrice ? parseFloat(pkg.basePrice.toString()) : 0;
  const advanceAmount = pkg?.advancePaymentAmount
    ? parseFloat(pkg.advancePaymentAmount.toString())
    : 0;

  // Format date using utility to avoid timezone issues
  const formatDate = () => {
    return formatDateForDisplay(appointment.date, locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleSubmit = async () => {
    if (!amount || !paymentMethod) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t("payment.errors.invalidAmount"));
      return;
    }

    if (advanceAmount > 0 && amountNum < advanceAmount) {
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
          amount: amountNum,
          paymentMethod,
          paymentType: "ADVANCE",
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        onPaymentRegistered();
        onOpenChange(false);
        // Reset form
        setAmount("");
        setPaymentMethod("");
        setReference("");
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
                {appointment.baby ? t("common.baby") : t("calendar.clientType.parent")}:
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
              <span className="font-medium text-gray-800">{pkg?.name || "-"}</span>
            </div>
            {packagePrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("payment.totalPrice")}:</span>
                <span className="font-medium text-gray-800">Bs. {packagePrice}</span>
              </div>
            )}
            {advanceAmount > 0 && (
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                <span className="text-amber-600 font-medium">{t("payment.advanceRequired")}:</span>
                <span className="font-bold text-amber-700">Bs. {advanceAmount}</span>
              </div>
            )}
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t("payment.amountReceived")}</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                Bs.
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 pl-12 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                placeholder="0.00"
              />
            </div>
            {advanceAmount > 0 && (
              <p className="text-xs text-gray-500">
                {t("payment.minimumAmount", { amount: advanceAmount })}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>{t("payment.paymentMethod")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all",
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-100 bg-white text-gray-500 hover:border-teal-200 hover:bg-teal-50/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected && "text-teal-600")} />
                    <span className="text-xs font-medium">
                      {t(`payment.methods.${method.label}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              {t("payment.reference")} <span className="text-gray-400">({t("payment.optional")})</span>
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="rounded-xl border-2 border-teal-100 focus:border-teal-400"
              placeholder={t("payment.referencePlaceholder")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("calendar.notes")} <span className="text-gray-400">({t("payment.optional")})</span>
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
            disabled={!amount || !paymentMethod || isSubmitting}
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
