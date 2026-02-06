"use client";

import { useState, useEffect, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { SplitPaymentForm } from "@/components/payments/split-payment-form";
import { getTodayDateString } from "@/lib/form-utils";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

// Constants outside component
const EXPENSE_CATEGORIES = [
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "MAINTENANCE",
  "MARKETING",
  "TAXES",
  "INSURANCE",
  "EQUIPMENT",
  "OTHER",
] as const;

interface PaymentDetail {
  amount: number;
  paymentMethod: "CASH" | "QR" | "CARD" | "TRANSFER";
  reference?: string;
}

interface ExpenseDialogProps {
  locale: string;
  trigger: ReactNode;
}

export function ExpenseDialog({ locale, trigger }: ExpenseDialogProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[number]>("SUPPLIES");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  // Reset form when dialog opens (not on close, to avoid flash during close animation)
  useEffect(() => {
    if (open) {
      setCategory("SUPPLIES");
      setDescription("");
      setAmount("");
      setReference("");
      setExpenseDate(getTodayDateString());
      setPaymentDetails([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!category || !description || !amount || !expenseDate) {
      toast.error(t("errors.missingFields"));
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t("errors.invalidAmount"));
      return;
    }

    // Validate payment details
    const totalPayment = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
    if (paymentDetails.length > 0 && Math.abs(totalPayment - amountNum) > 0.01) {
      toast.error(t("errors.paymentMismatch"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          amount: amountNum,
          reference: reference || undefined,
          expenseDate,
          paymentDetails: paymentDetails.length > 0 ? paymentDetails : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create expense");
      }

      toast.success(t("createSuccess"));
      setOpen(false);
      // Delay refresh to let dialog close animation complete
      setTimeout(() => router.refresh(), 300);
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-teal-500" />
            {t("dialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>{t("dialog.category")}</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as typeof category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t("dialog.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("dialog.descriptionPlaceholder")}
              rows={2}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t("dialog.amount")}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          {/* Expense Date */}
          <div className="space-y-2">
            <Label>{t("dialog.date")}</Label>
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label>{t("dialog.reference")}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t("dialog.referencePlaceholder")}
            />
          </div>

          {/* Payment Method (Split Payments) */}
          <div className="space-y-2">
            <Label>{t("dialog.paymentMethod")}</Label>
            <SplitPaymentForm
              totalAmount={amountNum}
              onPaymentDetailsChange={setPaymentDetails}
              currency={getCurrencySymbol(locale)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !category || !description || !amount}
              className="bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("dialog.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
