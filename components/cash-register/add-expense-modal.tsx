"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCashRegister } from "@/hooks/use-cash-register";
import { CashExpenseCategory } from "@prisma/client";
import { Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPENSE_CATEGORIES: CashExpenseCategory[] = [
  "SUPPLIES",
  "FOOD",
  "TRANSPORT",
  "BANK_DEPOSIT",
  "OTHER",
];

export function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
  const t = useTranslations("cashRegister");
  const locale = useLocale();
  const { addExpense } = useCashRegister();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CashExpenseCategory | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(t("expenseModal.errorInvalidAmount"));
      return;
    }

    if (!category) {
      toast.error(t("expenseModal.errorNoCategory"));
      return;
    }

    if (!description.trim()) {
      toast.error(t("expenseModal.errorNoDescription"));
      return;
    }

    try {
      setIsSubmitting(true);
      await addExpense(numAmount, category, description.trim());
      toast.success(t("expenseModal.success"));
      handleClose();
    } catch {
      toast.error(t("expenseModal.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setAmount("");
      setCategory("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-600" />
            {t("expenseModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("expenseModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="expenseAmount">{t("expenseModal.amount")}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {getCurrencySymbol(locale)}
              </span>
              <Input
                id="expenseAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t("expenseModal.category")}</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as CashExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("expenseModal.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`expenseCategories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="expenseDescription">
              {t("expenseModal.description")}
              {category === "OTHER" && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <Textarea
              id="expenseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("expenseModal.descriptionPlaceholder")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("expenseModal.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !amount || !category || !description}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="h-4 w-4" />
            )}
            {t("expenseModal.register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
