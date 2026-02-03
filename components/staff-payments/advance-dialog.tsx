"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { SplitPaymentForm } from "@/components/payments/split-payment-form";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: PayFrequency;
  advanceBalance: number;
}

interface PaymentDetail {
  amount: number;
  paymentMethod: "CASH" | "QR" | "CARD" | "TRANSFER";
  reference?: string;
}

interface AdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  staffList: StaffMember[];
  type: "ADVANCE" | "ADVANCE_RETURN";
}

export function AdvanceDialog({
  open,
  onOpenChange,
  locale,
  staffList,
  type,
}: AdvanceDialogProps) {
  const t = useTranslations("staffPayments");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const isAdvance = type === "ADVANCE";
  const Icon = isAdvance ? ArrowUpCircle : ArrowDownCircle;

  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  // Get selected staff info
  const selectedStaff = staffList.find((s) => s.id === staffId);
  const currentBalance = selectedStaff?.advanceBalance || 0;
  const amountNum = parseFloat(amount) || 0;

  // Filter staff for advance return - only those with balance > 0
  const availableStaff = isAdvance
    ? staffList
    : staffList.filter((s) => s.advanceBalance > 0);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStaffId("");
      setAmount("");
      setDescription("");
      setPaymentDetails([]);
    }
  }, [open]);

  // Auto-generate description
  useEffect(() => {
    if (staffId && selectedStaff) {
      const defaultDesc = isAdvance
        ? `${t("types.ADVANCE")} - ${selectedStaff.name}`
        : `${t("types.ADVANCE_RETURN")} - ${selectedStaff.name}`;
      setDescription(defaultDesc);
    }
  }, [staffId, selectedStaff, isAdvance, t]);

  const handleSubmit = async () => {
    if (!staffId || !amount || !description) {
      toast.error(t("errors.missingFields"));
      return;
    }

    // Validate amount for advance return
    if (!isAdvance && amountNum > currentBalance) {
      toast.error(t("errors.advanceReturnExceedsBalance"));
      return;
    }

    // Validate payment details for advance
    if (isAdvance && paymentDetails.length > 0) {
      const totalPayment = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(totalPayment - amountNum) > 0.01) {
        toast.error(t("errors.paymentMismatch"));
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/staff-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          type,
          amount: amountNum,
          description,
          paymentDetails: isAdvance && paymentDetails.length > 0 ? paymentDetails : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "ADVANCE_RETURN_EXCEEDS_BALANCE") {
          toast.error(t("errors.advanceReturnExceedsBalance"));
        } else {
          toast.error(t("errors.createFailed"));
        }
        return;
      }

      toast.success(t("createSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating advance:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isAdvance ? "text-amber-500" : "text-rose-500"}`} />
            {isAdvance ? t("quickActions.advance") : t("quickActions.advanceReturn")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* No staff with balance warning (for returns only) */}
          {!isAdvance && availableStaff.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4" />
              {t("advanceDialog.noStaffWithBalance")}
            </div>
          )}

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>{t("dialog.staff")}</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder={t("dialog.selectStaff")} />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <span>{staff.name}</span>
                      {staff.advanceBalance > 0 && (
                        <Badge
                          variant="outline"
                          className={isAdvance ? "text-amber-600" : "text-rose-600"}
                        >
                          {t("dialog.advancePending")}: {formatCurrency(staff.advanceBalance)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Balance Info */}
          {selectedStaff && (
            <div className={`rounded-lg p-3 ${isAdvance ? "bg-amber-50" : "bg-rose-50"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isAdvance ? "text-amber-700" : "text-rose-700"}`}>
                  {t("advanceDialog.currentBalance")}
                </span>
                <span className={`font-bold ${isAdvance ? "text-amber-700" : "text-rose-700"}`}>
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              {isAdvance && (
                <p className="mt-1 text-xs text-amber-600">
                  {t("advanceDialog.willIncreaseTo")} {formatCurrency(currentBalance + amountNum)}
                </p>
              )}
              {!isAdvance && amountNum > 0 && (
                <p className="mt-1 text-xs text-rose-600">
                  {t("advanceDialog.willDecreaseTo")} {formatCurrency(Math.max(0, currentBalance - amountNum))}
                </p>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>
              {t("dialog.grossAmount")}
              {!isAdvance && currentBalance > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({t("dialog.max")}: {formatCurrency(currentBalance)})
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              max={!isAdvance ? currentBalance : undefined}
              step="0.01"
            />
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

          {/* Payment Method (only for ADVANCE) */}
          {isAdvance && amountNum > 0 && (
            <div className="space-y-2">
              <Label>{t("dialog.paymentMethod")}</Label>
              <SplitPaymentForm
                totalAmount={amountNum}
                onPaymentDetailsChange={setPaymentDetails}
                currency={getCurrencySymbol(locale)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !staffId ||
                !amount ||
                !description ||
                (!isAdvance && amountNum > currentBalance)
              }
              className={
                isAdvance
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-rose-500 to-pink-500"
              }
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
