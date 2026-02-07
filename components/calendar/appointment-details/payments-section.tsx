"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { Ban, CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const VoidTransactionDialog = dynamic(
  () =>
    import("@/components/transactions/void-transaction-dialog").then(
      (m) => m.VoidTransactionDialog
    ),
  { ssr: false }
);

interface PaymentTransaction {
  id: string;
  category: string;
  total: number;
  paymentMethods: { method: string; amount: number }[];
  createdAt: string;
  isReversal: boolean;
  voidedAt: string | null;
  voidReason: string | null;
}

interface PaymentsSectionProps {
  appointmentId: string;
  onPaymentVoided?: () => void;
  canRegisterPayment?: boolean;
  onRegisterPayment?: () => void;
  packagePrice?: number;
}

export function PaymentsSection({
  appointmentId,
  onPaymentVoided,
  canRegisterPayment,
  onRegisterPayment,
  packagePrice,
}: PaymentsSectionProps) {
  const t = useTranslations();
  const tTx = useTranslations("transactions");
  const locale = useLocale();
  const { data: session } = useSession();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voidDialog, setVoidDialog] = useState<{
    open: boolean;
    transactionId: string;
    summary: string;
    amount: number;
  }>({ open: false, transactionId: "", summary: "", amount: 0 });

  const currencyLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const canVoid =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/payments`
      );
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch {
      // Silently fail - payments section is supplementary
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filter out reversals for display
  const displayPayments = payments.filter((p) => !p.isReversal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
      </div>
    );
  }

  // Calculate paid total from active (non-voided) payments
  const paidTotal = displayPayments
    .filter((p) => !p.voidedAt)
    .reduce((sum, p) => sum + Number(p.total), 0);
  const remaining = packagePrice ? Math.max(0, packagePrice - paidTotal) : 0;

  if (displayPayments.length === 0 && !canRegisterPayment) return null;

  const getCategoryLabel = (category: string) => {
    const key = `transactions.categories.${category}`;
    try {
      return t(key);
    } catch {
      return category;
    }
  };

  return (
    <>
      <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/30 p-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CreditCard className="h-4 w-4 text-teal-500" />
          {tTx("paymentsRegistered")}
        </h4>
        <div className="space-y-2">
          {displayPayments.map((payment) => {
            const isVoided = !!payment.voidedAt;
            return (
              <div
                key={payment.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  isVoided
                    ? "border-rose-200 bg-rose-50/50"
                    : "border-gray-100 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      isVoided
                        ? "bg-rose-100"
                        : "bg-emerald-100"
                    )}
                  >
                    {isVoided ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isVoided
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      )}
                    >
                      {getCategoryLabel(payment.category)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateForDisplay(
                        payment.createdAt,
                        locale === "pt-BR" ? "pt-BR" : "es-ES",
                        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                    {isVoided && payment.voidReason && (
                      <p className="mt-0.5 text-xs text-rose-500">
                        {tTx("voidReason", { reason: payment.voidReason })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isVoided ? "text-gray-400 line-through" : "text-gray-700"
                    )}
                  >
                    {formatCurrency(Number(payment.total), currencyLocale)}
                  </span>

                  {isVoided ? (
                    <Badge
                      variant="destructive"
                      className="text-[10px]"
                    >
                      {tTx("voided")}
                    </Badge>
                  ) : canVoid ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() =>
                        setVoidDialog({
                          open: true,
                          transactionId: payment.id,
                          summary: getCategoryLabel(payment.category),
                          amount: Number(payment.total),
                        })
                      }
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      {tTx("voidPayment")}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment summary + register button */}
        {canRegisterPayment && (
          <div className="space-y-2 pt-1">
            {paidTotal > 0 && packagePrice && packagePrice > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-teal-50/70 px-3 py-2 text-sm">
                <span className="text-gray-600">
                  {t("payment.alreadyPaid")}:{" "}
                  <span className="font-semibold text-teal-700">
                    {formatCurrency(paidTotal, currencyLocale)}
                  </span>
                </span>
                <span className="text-gray-600">
                  {t("payment.remaining")}:{" "}
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(remaining, currencyLocale)}
                  </span>
                </span>
              </div>
            )}
            <Button
              onClick={onRegisterPayment}
              variant="outline"
              className="w-full rounded-xl border-2 border-teal-200 py-5 text-teal-700 hover:bg-teal-50"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("payment.registerPayment")}
            </Button>
          </div>
        )}
      </div>

      {voidDialog.open && (
        <VoidTransactionDialog
          transactionId={voidDialog.transactionId}
          transactionSummary={voidDialog.summary}
          amount={voidDialog.amount}
          locale={locale}
          open={voidDialog.open}
          onOpenChange={(open) =>
            setVoidDialog((prev) => ({ ...prev, open }))
          }
          onVoided={() => {
            fetchPayments();
            onPaymentVoided?.();
          }}
        />
      )}
    </>
  );
}
