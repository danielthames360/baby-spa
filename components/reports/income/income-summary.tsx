"use client";

import { useTranslations } from "next-intl";
import { formatCurrency, formatPercent } from "@/lib/utils/currency-utils";
import { PaymentMethod } from "@prisma/client";
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  QrCode,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomeSummaryProps {
  total: number;
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  locale: string;
}

const METHOD_ICONS = {
  CASH: Banknote,
  QR: QrCode,
  CARD: CreditCard,
  TRANSFER: ArrowRightLeft,
};

const METHOD_COLORS = {
  CASH: "bg-emerald-100 text-emerald-700",
  QR: "bg-purple-100 text-purple-700",
  CARD: "bg-blue-100 text-blue-700",
  TRANSFER: "bg-amber-100 text-amber-700",
};

export function IncomeSummary({ total, byMethod, locale }: IncomeSummaryProps) {
  const t = useTranslations("reports.income");
  const tPayment = useTranslations("payment");

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-3">
            <DollarSign className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t("totalIncome")}</p>
            <p className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
              {formatCurrency(total, locale)}
            </p>
          </div>
        </div>
      </div>

      {/* By Method */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["CASH", "QR", "CARD", "TRANSFER"] as PaymentMethod[]).map((method) => {
          const data = byMethod.find((m) => m.method === method) || {
            amount: 0,
            count: 0,
          };
          const Icon = METHOD_ICONS[method];
          const percentage = total > 0 ? (data.amount / total) * 100 : 0;

          return (
            <div
              key={method}
              className="rounded-xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", METHOD_COLORS[method])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{tPayment(`methods.${method.toLowerCase()}`)}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(data.amount, locale)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{data.count} {t("transactions")}</span>
                  <span>{formatPercent(percentage, locale)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      method === "CASH" && "bg-gradient-to-r from-emerald-200 to-emerald-300",
                      method === "QR" && "bg-gradient-to-r from-purple-200 to-purple-300",
                      method === "CARD" && "bg-gradient-to-r from-blue-200 to-blue-300",
                      method === "TRANSFER" && "bg-gradient-to-r from-amber-200 to-amber-300"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
