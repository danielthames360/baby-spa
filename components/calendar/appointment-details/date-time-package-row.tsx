"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Package,
  Pencil,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentData } from "./types";
import type { PaymentStatus } from "@/lib/utils/installments";

interface DateTimePackageRowProps {
  appointment: AppointmentData;
  formattedDate: string;
  installmentPaymentStatus: PaymentStatus | null;
  isLoadingPackages: boolean;
  onEditPackage: () => void;
}

export function DateTimePackageRow({
  appointment,
  formattedDate,
  installmentPaymentStatus,
  isLoadingPackages,
  onEditPackage,
}: DateTimePackageRowProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Format time string to HH:mm
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Date & Time combined */}
      <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200">
          <Calendar className="h-5 w-5 text-gray-600" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800">
            {formattedDate}
          </p>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-3 w-3" />
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </p>
        </div>
      </div>

      {/* Package - compact */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl p-3",
          appointment.packagePurchase || appointment.selectedPackage
            ? "border border-teal-200 bg-teal-50"
            : "border border-amber-200 bg-amber-50"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            appointment.packagePurchase || appointment.selectedPackage
              ? "bg-teal-100"
              : "bg-amber-100"
          )}
        >
          <Package
            className={cn(
              "h-5 w-5",
              appointment.packagePurchase || appointment.selectedPackage
                ? "text-teal-600"
                : "text-amber-600"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              appointment.packagePurchase || appointment.selectedPackage
                ? "text-teal-700"
                : "text-amber-700"
            )}
          >
            {appointment.packagePurchase
              ? appointment.packagePurchase.package.name
              : appointment.selectedPackage
                ? appointment.selectedPackage.name
                : t("calendar.sessionToDefine")}
          </p>
          {/* Installment payment overdue badge */}
          {installmentPaymentStatus &&
            installmentPaymentStatus.overdueAmount > 0 && (
              <Badge className="mt-1 flex w-fit items-center gap-1 border border-amber-300 bg-amber-100 px-1.5 py-0 text-amber-700 hover:bg-amber-100">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px] font-medium">
                  {t("packages.installments.alerts.paymentWarning")}
                </span>
              </Badge>
            )}
          {/* Advance payment amount for PENDING_PAYMENT */}
          {appointment.status === "PENDING_PAYMENT" &&
            appointment.selectedPackage?.advancePaymentAmount && (
              <p className="mt-1 text-xs font-bold text-orange-600">
                💰 {formatCurrency(parseFloat(
                  appointment.selectedPackage.advancePaymentAmount.toString()
                ), locale)}
              </p>
            )}
        </div>
        {/* Edit button - only for scheduled appointments */}
        {appointment.status === "SCHEDULED" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditPackage}
            disabled={isLoadingPackages}
            className="h-8 w-8 shrink-0 p-0 text-teal-600 hover:bg-teal-100 hover:text-teal-700"
          >
            {isLoadingPackages ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
