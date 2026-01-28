"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Loader2,
  CreditCard,
  Calendar,
  Sparkles,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import { useForm } from "react-hook-form";
import { getNextInstallmentToPay, parsePayOnSessions } from "@/lib/utils/installments";
import {
  SplitPaymentForm,
  type PaymentDetailInput,
} from "@/components/payments/split-payment-form";

interface PackagePurchase {
  id: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  installments: number;
  // Accept string for JSON-serialized Prisma.Decimal values
  installmentAmount: Prisma.Decimal | number | string | null;
  paidAmount: Prisma.Decimal | number | string;
  finalPrice: Prisma.Decimal | number | string;
  totalPrice?: Prisma.Decimal | number | string | null;
  paymentPlan: string;
  installmentsPayOnSessions?: string | null;
  package: {
    id: string;
    name: string;
  };
  baby?: {
    id: string;
    name: string;
  };
}

interface RegisterInstallmentPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: PackagePurchase;
  onSuccess: () => void;
}

interface FormData {
  notes: string;
}

export function RegisterInstallmentPaymentDialog({
  open,
  onOpenChange,
  purchase,
  onSuccess,
}: RegisterInstallmentPaymentDialogProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);

  // Calculate next installment to pay
  const purchaseForCalc = {
    totalSessions: purchase.totalSessions,
    usedSessions: purchase.usedSessions,
    remainingSessions: purchase.remainingSessions,
    installments: purchase.installments,
    installmentAmount: purchase.installmentAmount,
    paidAmount: purchase.paidAmount,
    finalPrice: purchase.finalPrice,
    totalPrice: purchase.totalPrice ?? null,
    paymentPlan: purchase.paymentPlan,
    installmentsPayOnSessions: purchase.installmentsPayOnSessions ?? null,
  };
  const nextInstallment = getNextInstallmentToPay(purchaseForCalc);
  const installmentAmount = purchase.installmentAmount
    ? Number(purchase.installmentAmount)
    : 0;

  const form = useForm<FormData>({
    defaultValues: {
      notes: "",
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const handlePaymentDetailsChange = useCallback(
    (details: PaymentDetailInput[]) => {
      setPaymentDetails(details);
    },
    []
  );

  const onSubmit = async (data: FormData) => {
    if (paymentDetails.length === 0) {
      return;
    }

    const totalPaid = paymentDetails.reduce((sum, d) => sum + d.amount, 0);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/package-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packagePurchaseId: purchase.id,
          installmentNumber: nextInstallment || 1,
          amount: totalPaid,
          paymentDetails,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register payment");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error registering payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!nextInstallment) {
    return null; // All installments are paid
  }

  const isValid = paymentDetails.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("packages.installments.registerPayment")}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {purchase.package.name}
                {purchase.baby && ` - ${purchase.baby.name}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Installment info card */}
            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-gray-700">
                    {t("packages.installments.installmentNumber", {
                      number: nextInstallment,
                    })}
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {formatPrice(installmentAmount)}
                </span>
              </div>
              {(() => {
                const payOnSessions = parsePayOnSessions(
                  purchase.installmentsPayOnSessions
                );
                const dueOnSession =
                  payOnSessions[nextInstallment ? nextInstallment - 1 : 0];
                return dueOnSession ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>
                      {t("packages.installments.payOnSession", {
                        session: dueOnSession,
                      })}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Split Payment Form */}
            <SplitPaymentForm
              totalAmount={installmentAmount}
              onPaymentDetailsChange={handlePaymentDetailsChange}
              disabled={isSubmitting}
              showReference={true}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">
                    {t("packages.paymentNotes")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("packages.paymentNotesPlaceholder")}
                      className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg shadow-amber-300/50 transition-all hover:from-amber-600 hover:to-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("packages.installments.registerPayment")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
