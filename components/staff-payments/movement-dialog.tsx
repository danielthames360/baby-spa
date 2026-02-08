"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
import { Loader2, Gift, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

// Movement types only (things that accumulate)
const MOVEMENT_TYPES = [
  { value: "BONUS", icon: Gift, color: "text-green-600" },
  { value: "COMMISSION", icon: Plus, color: "text-emerald-600" },
  { value: "BENEFIT", icon: Plus, color: "text-teal-600" },
  { value: "DEDUCTION", icon: Minus, color: "text-red-600" },
] as const;

type MovementType = (typeof MOVEMENT_TYPES)[number]["value"];
type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: PayFrequency;
  advanceBalance: number;
}

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  staffList: StaffMember[];
}

export function MovementDialog({
  open,
  onOpenChange,
  staffList,
}: MovementDialogProps) {
  const t = useTranslations("staffPayments");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [type, setType] = useState<MovementType>("BONUS");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [movementDate, setMovementDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStaffId("");
      setType("BONUS");
      setAmount("");
      setDescription("");
      setMovementDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!staffId || !amount || !description) {
      toast.error(t("errors.missingFields"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/staff-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          type,
          amount: parseFloat(amount),
          description,
          movementDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "PERIOD_ALREADY_PAID") {
          toast.error(t("errors.periodAlreadyPaid"));
        } else {
          toast.error(t("errors.createFailed"));
        }
        return;
      }

      toast.success(t("createSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating movement:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const isDeduction = type === "DEDUCTION";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-500" />
            {t("quickActions.movement")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>{t("dialog.staff")}</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder={t("dialog.selectStaff")} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement Type */}
          <div className="space-y-2">
            <Label>{t("dialog.type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {MOVEMENT_TYPES.map((mt) => {
                const Icon = mt.icon;
                const isSelected = type === mt.value;
                const isExpense = mt.value === "DEDUCTION";
                return (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setType(mt.value)}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? isExpense
                          ? "border-red-500 bg-red-50"
                          : "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected
                          ? isExpense
                            ? "text-red-600"
                            : "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? isExpense
                            ? "text-red-700"
                            : "text-green-700"
                          : "text-gray-600"
                      }`}
                    >
                      {t(`types.${mt.value}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{t("table.date")}</Label>
            <Input
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>
              {t("dialog.grossAmount")}
              {isDeduction && (
                <span className="ml-2 text-xs text-red-500">
                  ({t("movementDialog.willBeDeducted")})
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
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

          {/* Info box */}
          <div className={`rounded-lg p-3 text-sm ${isDeduction ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {isDeduction
              ? t("movementDialog.deductionInfo")
              : t("movementDialog.incomeInfo")}
          </div>

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
              disabled={loading || !staffId || !amount || !description}
              className={isDeduction
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-emerald-500 to-green-500"
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
