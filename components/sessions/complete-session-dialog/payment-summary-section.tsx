"use client";

import { useTranslations } from "next-intl";
import {
  Check,
  CheckCircle,
  DollarSign,
  Percent,
  Star,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SplitPaymentForm,
  type PaymentDetailInput,
} from "@/components/payments/split-payment-form";
import type { BabyCardCheckoutInfo, PackageData } from "./types";

interface PaymentSummarySectionProps {
  selectedPackage: PackageData | null | undefined;
  selectedPurchaseId: string | null;
  selectedPurchaseName: string;
  packagePrice: number;
  productsTotal: number;
  subtotal: number;
  discountAmount: number;
  firstSessionDiscountValue: number;
  advancePaidAmount: number;
  grandTotal: number;
  showDiscount: boolean;
  onToggleDiscount: () => void;
  onDiscountAmountChange: (amount: number) => void;
  discountReason: string;
  onDiscountReasonChange: (reason: string) => void;
  useFirstSessionDiscount: boolean;
  onToggleFirstSessionDiscount: () => void;
  babyCardInfo: BabyCardCheckoutInfo | null;
  selectedPackageId: string | null;
  onPaymentDetailsChange: (details: PaymentDetailInput[]) => void;
  isSubmitting: boolean;
  formatPrice: (price: number) => string;
}

export function PaymentSummarySection({
  selectedPackage,
  selectedPurchaseId,
  selectedPurchaseName,
  packagePrice,
  productsTotal,
  subtotal,
  discountAmount,
  firstSessionDiscountValue,
  advancePaidAmount,
  grandTotal,
  showDiscount,
  onToggleDiscount,
  onDiscountAmountChange,
  discountReason,
  onDiscountReasonChange,
  useFirstSessionDiscount,
  onToggleFirstSessionDiscount,
  babyCardInfo,
  selectedPackageId,
  onPaymentDetailsChange,
  isSubmitting,
  formatPrice,
}: PaymentSummarySectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-5">
      {/* Summary & Discounts Section */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          {t("session.summaryAndPayment")}
        </h3>

        {/* Subtotals */}
        <div className="space-y-2 mb-4">
          {selectedPurchaseId && selectedPurchaseName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t("session.usingExistingPackage")}
              </span>
              <span className="text-emerald-600 font-medium">
                {selectedPurchaseName}
              </span>
            </div>
          )}
          {selectedPackage && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t("session.packageSubtotal")}
              </span>
              <span className="text-gray-800 font-medium">
                {formatPrice(packagePrice)}
              </span>
            </div>
          )}
          {productsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t("session.productsSubtotal")}
              </span>
              <span className="text-gray-800 font-medium">
                {formatPrice(productsTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Discounts Section */}
        {subtotal > 0 && (
          <div className="border-t border-gray-200/50 pt-4 mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
              {t("packages.discounts")}
            </p>

            {/* First Session Discount - Show only if available and not used */}
            {babyCardInfo?.firstSessionDiscount &&
              !babyCardInfo.firstSessionDiscount.used && (
                <button
                  type="button"
                  onClick={onToggleFirstSessionDiscount}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl border-2 p-3 mb-2 transition-all",
                    useFirstSessionDiscount
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-200 bg-white hover:border-amber-200"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Star
                      className={cn(
                        "h-4 w-4",
                        useFirstSessionDiscount ? "text-amber-500" : "text-gray-400"
                      )}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t("babyCard.checkout.firstSessionDiscount")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-600">
                      -{formatPrice(babyCardInfo.firstSessionDiscount.amount)}
                    </span>
                    {useFirstSessionDiscount && (
                      <Check className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </button>
              )}

            {/* Manual Discount Toggle */}
            <button
              type="button"
              onClick={onToggleDiscount}
              className={cn(
                "w-full flex items-center justify-between rounded-xl border-2 p-3 transition-all",
                showDiscount || discountAmount > 0
                  ? "border-teal-400 bg-teal-50"
                  : "border-dashed border-gray-300 bg-white hover:border-teal-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Percent
                  className={cn(
                    "h-4 w-4",
                    discountAmount > 0 ? "text-teal-500" : "text-gray-400"
                  )}
                />
                <span className="text-sm font-medium text-gray-700">
                  {discountAmount > 0
                    ? t("packages.discount")
                    : t("packages.addDiscount")}
                </span>
              </div>
              {discountAmount > 0 && (
                <span className="text-sm font-bold text-rose-600">
                  -{formatPrice(discountAmount)}
                </span>
              )}
            </button>

            {showDiscount && (
              <div className="mt-3 space-y-3 rounded-xl bg-white p-4 border border-teal-100">
                <div>
                  <Label className="text-gray-700 mb-1.5 block text-sm">
                    {t("packages.discountAmount")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={subtotal}
                    step="0.01"
                    value={discountAmount || ""}
                    onChange={(e) =>
                      onDiscountAmountChange(Number(e.target.value) || 0)
                    }
                    className="h-10 rounded-xl border-2 border-gray-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 mb-1.5 block text-sm">
                    {t("packages.discountReason")}
                  </Label>
                  <Input
                    value={discountReason}
                    onChange={(e) => onDiscountReasonChange(e.target.value)}
                    placeholder={t("packages.discountReasonPlaceholder")}
                    className="h-10 rounded-xl border-2 border-gray-200"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advance payment deduction */}
        {advancePaidAmount > 0 && (
          <div className="flex justify-between items-center text-sm border-t border-gray-200/50 pt-3 mb-3">
            <span className="text-gray-600">{t("session.advancePaid")}</span>
            <span className="font-medium text-emerald-600">
              -{formatPrice(advancePaidAmount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center border-t border-emerald-200 pt-4">
          <span className="font-semibold text-gray-700">{t("session.total")}</span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      {/* Payment Section - Only show when there's an amount to pay */}
      {grandTotal > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
          <SplitPaymentForm
            totalAmount={grandTotal}
            onPaymentDetailsChange={onPaymentDetailsChange}
            disabled={isSubmitting}
            showReference={true}
          />
        </div>
      )}

      {/* No payment needed message */}
      {grandTotal === 0 && (selectedPackageId || selectedPurchaseId) && (
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-emerald-700">
            {t("session.noPaymentRequired")}
          </p>
        </div>
      )}
    </div>
  );
}
