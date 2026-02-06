"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "./types";

interface AlertsSectionProps {
  installmentPaymentStatus: PaymentStatus | null;
  parentPreferencesText: string | null;
  onShowInstallmentPayment: () => void;
}

export function AlertsSection({
  installmentPaymentStatus,
  parentPreferencesText,
  onShowInstallmentPayment,
}: AlertsSectionProps) {
  const t = useTranslations();

  return (
    <>
      {/* Installment payment alert - NEVER blocks, just informs */}
      {installmentPaymentStatus && !installmentPaymentStatus.isPaidInFull && (
        <Alert
          className={
            installmentPaymentStatus.overdueAmount > 0
              ? "border-amber-200 bg-amber-50"
              : "border-blue-200 bg-blue-50"
          }
        >
          <AlertTriangle
            className={`h-4 w-4 ${
              installmentPaymentStatus.overdueAmount > 0
                ? "text-amber-600"
                : "text-blue-600"
            }`}
          />
          <AlertDescription className="ml-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={`text-sm ${
                  installmentPaymentStatus.overdueAmount > 0
                    ? "text-amber-800"
                    : "text-blue-800"
                }`}
              >
                {installmentPaymentStatus.overdueAmount > 0 ? (
                  installmentPaymentStatus.overdueInstallments.length === 1 ? (
                    t("packages.installments.alerts.installmentOverdue", {
                      number: installmentPaymentStatus.overdueInstallments[0],
                      amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                    })
                  ) : (
                    t("packages.installments.alerts.installmentsOverdue", {
                      count: installmentPaymentStatus.overdueInstallments.length,
                      amount: installmentPaymentStatus.overdueAmount.toFixed(2),
                    })
                  )
                ) : (
                  t("packages.installments.remainingBalance") +
                  ": " +
                  installmentPaymentStatus.pendingAmount.toFixed(2)
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onShowInstallmentPayment}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium text-white shadow-sm",
                    installmentPaymentStatus.overdueAmount > 0
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  )}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  {t("packages.installments.registerPayment")}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Parent schedule preferences - highlighted alert */}
      {parentPreferencesText && (
        <Alert className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50">
          <CalendarClock className="h-4 w-4 text-cyan-600" />
          <AlertDescription className="ml-2">
            <p className="font-medium text-cyan-800">
              {t("session.parentPreferredSchedule")}
            </p>
            <p className="font-semibold text-cyan-700">{parentPreferencesText}</p>
            <p className="text-xs text-cyan-600">
              {t("session.preferencesWillBeSaved")}
            </p>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
