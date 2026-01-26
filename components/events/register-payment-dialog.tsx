"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CreditCard, Wallet, Building, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const paymentSchema = z.object({
  amount: z.number().min(0.01, "AMOUNT_REQUIRED"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
  paymentReference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Payment method options with icons
const PAYMENT_METHODS = [
  { value: "CASH", icon: Wallet, labelKey: "events.payment.methods.cash" },
  { value: "TRANSFER", icon: Building, labelKey: "events.payment.methods.transfer" },
  { value: "CARD", icon: CreditCard, labelKey: "events.payment.methods.card" },
  { value: "OTHER", icon: MoreHorizontal, labelKey: "events.payment.methods.other" },
] as const;

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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingAmount = amountDue - amountPaid;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: pendingAmount > 0 ? pendingAmount : 0,
      paymentMethod: "CASH",
      paymentReference: "",
    },
  });

  const handleSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/participants/${participantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error registering payment");
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

  const selectedMethod = form.watch("paymentMethod");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-teal-600" />
            {t("events.payment.registerPayment")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Participant info */}
            <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
              <p className="font-medium text-gray-800">{participantName}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("events.payment.pending")}</span>
                <span className="font-semibold text-amber-600">
                  Bs. {pendingAmount.toFixed(0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("events.payment.alreadyPaid")}</span>
                <span className="font-medium text-emerald-600">
                  Bs. {amountPaid.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.payment.amount")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        Bs.
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="h-12 rounded-xl border-2 border-teal-100 pl-12 text-lg font-semibold"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.payment.method")}</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map(({ value, icon: Icon, labelKey }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all",
                          selectedMethod === value
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 text-gray-600 hover:border-teal-200 hover:bg-gray-50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">
                          {t(labelKey)}
                        </span>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Reference (for transfer/card) */}
            {(selectedMethod === "TRANSFER" || selectedMethod === "CARD") && (
              <FormField
                control={form.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.payment.reference")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("events.payment.referencePlaceholder")}
                        className="h-12 rounded-xl border-2 border-teal-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                type="submit"
                disabled={isSubmitting}
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
