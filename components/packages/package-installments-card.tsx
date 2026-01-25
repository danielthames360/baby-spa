"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  Calendar,
  Check,
  Clock,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import {
  getInstallmentsDetail,
  getPaymentSummary,
  hasPendingInstallments,
  type InstallmentDetail,
} from "@/lib/utils/installments";

interface PackagePayment {
  id: string;
  installmentNumber: number;
  amount: Prisma.Decimal;
  paymentMethod: string;
  paidAt: Date;
}

interface PackagePurchase {
  id: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  installments: number;
  installmentAmount: Prisma.Decimal | null;
  paidAmount: Prisma.Decimal;
  finalPrice: Prisma.Decimal;
  totalPrice?: Prisma.Decimal | null;
  paymentPlan: string;
  installmentsPayOnSessions?: string | null;
  package: {
    id: string;
    name: string;
  };
  installmentPayments?: PackagePayment[];
}

interface PackageInstallmentsCardProps {
  purchase: PackagePurchase;
  onRegisterPayment?: () => void;
}

export function PackageInstallmentsCard({
  purchase,
  onRegisterPayment,
}: PackageInstallmentsCardProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  // Only show if purchase has installments > 1
  if (purchase.installments <= 1) {
    return null;
  }

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

  const payments = purchase.installmentPayments?.map((p) => ({
    amount: p.amount,
    paidAt: p.paidAt,
  })) || [];

  const installmentStatuses = getInstallmentsDetail(purchaseForCalc, payments);
  const summary = getPaymentSummary(purchaseForCalc);
  const hasPending = hasPendingInstallments(purchaseForCalc);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100">
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">
              {t("packages.installments.title")}
            </h4>
            <p className="text-xs text-gray-500">
              {t("packages.installments.paidInstallments", {
                paid: summary.paidInstallments,
                total: summary.totalInstallments,
              })}
            </p>
          </div>
        </div>
        {hasPending && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            {formatPrice(summary.remainingAmount)} {t("packages.installments.pending").toLowerCase()}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${summary.percentagePaid}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>{formatPrice(summary.paidAmount)} {t("packages.installments.paid").toLowerCase()}</span>
          <span>{formatPrice(summary.totalAmount)} total</span>
        </div>
      </div>

      {/* Installments list */}
      <div className="space-y-2">
        {installmentStatuses.map((installment: InstallmentDetail) => (
          <InstallmentItem
            key={installment.number}
            installment={installment}
            t={t}
            formatPrice={formatPrice}
            formatDate={formatDate}
            payment={purchase.installmentPayments?.find(
              (p) => p.installmentNumber === installment.number
            )}
          />
        ))}
      </div>

      {/* Register payment button */}
      {hasPending && onRegisterPayment && (
        <Button
          onClick={onRegisterPayment}
          className="mt-4 w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-white shadow-md shadow-amber-200 transition-all hover:from-amber-600 hover:to-orange-600"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {t("packages.installments.registerPayment")}
        </Button>
      )}

      {/* Fully paid badge */}
      {!hasPending && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-emerald-700">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t("packages.installments.fullyPaid")}
          </span>
        </div>
      )}
    </Card>
  );
}

function InstallmentItem({
  installment,
  t,
  formatPrice,
  formatDate,
  payment,
}: {
  installment: InstallmentDetail;
  t: ReturnType<typeof useTranslations>;
  formatPrice: (price: number) => string;
  formatDate: (date: Date) => string;
  payment?: PackagePayment;
}) {
  const isPaid = installment.status === 'PAID';
  const isOverdue = installment.status === 'OVERDUE';

  return (
    <div
      className={`flex items-center justify-between rounded-xl p-3 transition-all ${
        isPaid
          ? "bg-emerald-50 border border-emerald-100"
          : isOverdue
          ? "bg-amber-50 border border-amber-100"
          : "bg-gray-50 border border-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isPaid
              ? "bg-emerald-500 text-white"
              : isOverdue
              ? "bg-amber-500 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {isPaid ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="text-sm font-medium">{installment.number}</span>
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${isPaid ? "text-emerald-700" : isOverdue ? "text-amber-700" : "text-gray-700"}`}>
            {t("packages.installments.installmentNumber", {
              number: installment.number,
            })}
          </p>
          {installment.payOnSession && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="h-3 w-3" />
              <span>
                {t("packages.installments.payOnSession", {
                  session: installment.payOnSession,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isPaid ? "text-emerald-600" : isOverdue ? "text-amber-600" : "text-gray-700"}`}>
          {formatPrice(installment.amount)}
        </p>
        {isPaid && payment?.paidAt ? (
          <p className="text-xs text-emerald-600">
            {formatDate(payment.paidAt)}
          </p>
        ) : isOverdue ? (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Clock className="h-3 w-3" />
            <span>{t("packages.installments.overdue")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{t("packages.installments.pending")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
