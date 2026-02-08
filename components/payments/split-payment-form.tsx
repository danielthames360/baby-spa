"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCurrencySymbol, formatNumber as formatNumberUtil } from "@/lib/utils/currency-utils";
import {
  Banknote,
  Building2,
  CreditCard,
  QrCode,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Payment method options (CASH, QR, CARD, TRANSFER) - ordered by usage frequency
const PAYMENT_METHODS = [
  { value: "CASH", icon: Banknote, labelKey: "cash" },
  { value: "QR", icon: QrCode, labelKey: "qr" },
  { value: "CARD", icon: CreditCard, labelKey: "card" },
  { value: "TRANSFER", icon: Building2, labelKey: "transfer" },
] as const;

type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export interface PaymentDetailInput {
  amount: number;
  paymentMethod: PaymentMethodValue;
  reference?: string;
}

interface PaymentLine {
  id: string;
  amount: number;
  paymentMethod: PaymentMethodValue | null;
  reference: string;
}

interface SplitPaymentFormProps {
  totalAmount: number;
  onPaymentDetailsChange: (details: PaymentDetailInput[]) => void;
  disabled?: boolean;
  /** Show reference field for each payment line */
  showReference?: boolean;
  /** Currency symbol/code (default: locale-aware via getCurrencySymbol) */
  currency?: string;
  /** Initial payment details to populate */
  initialDetails?: PaymentDetailInput[];
  /** Allow sum to be less than totalAmount (for partial/advance payments) */
  allowPartialPayment?: boolean;
}

// Generate unique ID for payment lines
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function SplitPaymentForm({
  totalAmount,
  onPaymentDetailsChange,
  disabled = false,
  showReference = true,
  currency: currencyProp,
  initialDetails,
  allowPartialPayment = false,
}: SplitPaymentFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const currency = currencyProp || getCurrencySymbol(locale);

  // Initialize lines from initialDetails or with a single empty line
  const [lines, setLines] = useState<PaymentLine[]>(() => {
    if (initialDetails && initialDetails.length > 0) {
      return initialDetails.map((d) => ({
        id: generateId(),
        amount: d.amount,
        paymentMethod: d.paymentMethod,
        reference: d.reference || "",
      }));
    }
    return [
      {
        id: generateId(),
        amount: totalAmount,
        paymentMethod: null,
        reference: "",
      },
    ];
  });

  // Calculate sum and validate
  const validateLines = useCallback(
    (currentLines: PaymentLine[]) => {
      const sum = currentLines.reduce((acc, line) => acc + (line.amount || 0), 0);
      const tolerance = 0.01;

      if (allowPartialPayment) {
        // Partial: sum must be > 0 and <= totalAmount
        if (sum < tolerance) {
          return { valid: false, error: "AMOUNT_POSITIVE", sum };
        }
        if (sum > totalAmount + tolerance) {
          return { valid: false, error: "SUM_EXCEEDS", sum };
        }
      } else {
        // Exact: sum must equal totalAmount
        const diff = Math.abs(sum - totalAmount);
        if (diff > tolerance) {
          return { valid: false, error: "SUM_MISMATCH", sum };
        }
      }

      // Check all lines have a payment method
      const allHaveMethod = currentLines.every((line) => line.paymentMethod !== null);
      if (!allHaveMethod) {
        return { valid: false, error: "METHOD_REQUIRED", sum };
      }

      // Check all amounts are positive
      const allPositive = currentLines.every((line) => line.amount > 0);
      if (!allPositive) {
        return { valid: false, error: "AMOUNT_POSITIVE", sum };
      }

      return { valid: true, sum };
    },
    [totalAmount, allowPartialPayment]
  );

  // Derived state: compute validation during render instead of via useEffect
  const validation = useMemo(() => validateLines(lines), [lines, validateLines]);

  // Notify parent when validation status changes
  useEffect(() => {
    if (validation.valid) {
      const details: PaymentDetailInput[] = lines.map((line) => ({
        amount: line.amount,
        paymentMethod: line.paymentMethod as PaymentMethodValue,
        reference: line.reference || undefined,
      }));
      onPaymentDetailsChange(details);
    } else {
      onPaymentDetailsChange([]);
    }
  }, [lines, validation.valid, onPaymentDetailsChange]);

  // Auto-sync single line amount when totalAmount changes (e.g., discount applied)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Prop sync: update line amount when parent changes total
    setLines((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], amount: totalAmount }];
      }
      return prev;
    });
  }, [totalAmount]);

  // Add a new payment line
  const addLine = () => {
    const currentSum = lines.reduce((acc, line) => acc + (line.amount || 0), 0);
    const remaining = Math.max(0, totalAmount - currentSum);

    setLines((prev) => [
      ...prev,
      {
        id: generateId(),
        amount: remaining,
        paymentMethod: null,
        reference: "",
      },
    ]);
  };

  // Remove a payment line
  const removeLine = (id: string) => {
    if (lines.length <= 1) return; // Keep at least one line

    const lineToRemove = lines.find((l) => l.id === id);
    const remaining = lines.filter((l) => l.id !== id);

    // Redistribute amount to first remaining line
    if (lineToRemove && remaining.length > 0) {
      const redistributeAmount = lineToRemove.amount;
      remaining[0] = {
        ...remaining[0],
        amount: remaining[0].amount + redistributeAmount,
      };
    }

    setLines(remaining);
  };

  // Update a line's field
  const updateLine = (
    id: string,
    field: keyof Omit<PaymentLine, "id">,
    value: string | number | null
  ) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  };

  // Format number (without currency symbol - used for display in split lines)
  const formatCurrency = (amount: number) => formatNumberUtil(amount, locale);

  const remaining = totalAmount - validation.sum;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {t("payment.split.title")}
        </Label>
        <span className="text-sm text-gray-500">
          {t("packages.total")}: {currency} {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Payment lines */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div
            key={line.id}
            className="rounded-xl border-2 border-gray-100 bg-gray-50/50 p-4 space-y-3"
          >
            {/* Payment method buttons */}
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = line.paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updateLine(line.id, "paymentMethod", method.value)
                    }
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all",
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-100 bg-white text-gray-500 hover:border-teal-200 hover:bg-teal-50/30",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4", isSelected && "text-teal-600")}
                    />
                    <span className="text-xs font-medium">
                      {t(`payment.methods.${method.labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Amount and Reference row */}
            <div className="flex items-center gap-3">
              {/* Amount input */}
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    {currency}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.amount || ""}
                    onChange={(e) =>
                      updateLine(
                        line.id,
                        "amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={disabled}
                    className="h-10 pl-10 rounded-lg border-gray-200 focus:border-teal-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Reference input (optional) */}
              {showReference && (
                <div className="flex-1">
                  <Input
                    value={line.reference}
                    onChange={(e) =>
                      updateLine(line.id, "reference", e.target.value)
                    }
                    disabled={disabled}
                    className="h-10 rounded-lg border-gray-200 focus:border-teal-400"
                    placeholder={t("payment.reference")}
                  />
                </div>
              )}

              {/* Remove button */}
              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => removeLine(line.id)}
                  className="h-10 w-10 text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={addLine}
        className="w-full rounded-lg border-dashed border-2 border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("payment.split.addMethod")}
      </Button>

      {/* Summary */}
      <div
        className={cn(
          "rounded-lg p-3 flex items-center justify-between",
          validation.valid
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-amber-50 border border-amber-200"
        )}
      >
        <div className="flex items-center gap-2">
          {validation.valid ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              validation.valid ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {t("payment.split.totalPaid")}: {currency} {formatCurrency(validation.sum)}
          </span>
        </div>

        {!validation.valid && Math.abs(remaining) > 0.01 && (
          <span className="text-sm text-amber-600">
            {remaining > 0
              ? t("payment.split.remaining") + `: ${currency} ${formatCurrency(remaining)}`
              : t("payment.split.excess") + `: ${currency} ${formatCurrency(Math.abs(remaining))}`}
          </span>
        )}
      </div>

      {/* Validation error message */}
      {!validation.valid && validation.error && (
        <p className="text-xs text-rose-500" role="alert" aria-live="polite">
          {t(`payment.split.errors.${validation.error.toLowerCase().replace("_", "")}`)}
        </p>
      )}
    </div>
  );
}
