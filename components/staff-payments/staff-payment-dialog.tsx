"use client";

import { useState, useEffect, ReactNode, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import { es, ptBR } from "date-fns/locale";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  Banknote,
  TrendingUp,
  AlertTriangle,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { SplitPaymentForm } from "@/components/payments/split-payment-form";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

// Movement types (records that accumulate, not actual payments)
const MOVEMENT_TYPES = ["BONUS", "COMMISSION", "BENEFIT", "DEDUCTION"] as const;

// Payment types (actual money transfers)
const PAYMENT_TYPES_ACTUAL = ["SALARY", "ADVANCE", "ADVANCE_RETURN"] as const;

// For the type selector - Income (positive for employee)
const INCOME_TYPES = [
  "SALARY",
  "COMMISSION",
  "BONUS",
  "BENEFIT",
  "ADVANCE",
] as const;

// For the type selector - Expenses (negative for employee)
const EXPENSE_TYPES = ["DEDUCTION", "ADVANCE_RETURN"] as const;

const ALL_TYPES = [...INCOME_TYPES, ...EXPENSE_TYPES] as const;

type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: PayFrequency;
  advanceBalance: number;
}

interface StaffStats {
  sessionsCount: number;
  daysWithSessions: number;
  totalWorkDays: number;
  daysWithoutSessions: number[];
  babyCardsSold: number;
}

interface SalaryPreview {
  staff: {
    id: string;
    name: string;
    baseSalary: number;
    payFrequency: PayFrequency;
  };
  period: {
    start: string;
    end: string;
  };
  baseSalaryPerPeriod: number;
  movements: {
    income: Array<{
      id: string;
      type: string;
      description: string;
      grossAmount: number;
      movementDate: string | null;
    }>;
    expenses: Array<{
      id: string;
      type: string;
      description: string;
      grossAmount: number;
      movementDate: string | null;
    }>;
    totalIncome: number;
    totalExpenses: number;
  };
  advanceBalance: number;
  suggestedAdvanceDeduction: number;
  grossAmount: number;
  netAmount: number;
}

interface PaymentDetail {
  amount: number;
  paymentMethod: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  reference?: string;
}

interface StaffPaymentDialogProps {
  locale: string;
  staffList: StaffMember[];
  trigger: ReactNode;
}

// Helper to calculate period dates based on frequency
function calculatePeriodDates(date: Date, frequency: PayFrequency): { start: Date; end: Date } {
  switch (frequency) {
    case "DAILY":
      return { start: date, end: date };
    case "WEEKLY": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
      return { start: weekStart, end: weekEnd };
    }
    case "BIWEEKLY": {
      const day = date.getDate();
      if (day <= 15) {
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth(), 15),
        };
      } else {
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 16),
          end: endOfMonth(date),
        };
      }
    }
    case "MONTHLY":
    default:
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
}

export function StaffPaymentDialog({
  locale,
  staffList,
  trigger,
}: StaffPaymentDialogProps) {
  const t = useTranslations("staffPayments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dateLocale = locale === "pt-BR" ? ptBR : es;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Form state
  const [staffId, setStaffId] = useState("");
  const [type, setType] = useState<(typeof ALL_TYPES)[number]>("BONUS");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [movementDate, setMovementDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deductAdvance, setDeductAdvance] = useState(false);
  const [advanceToDeduct, setAdvanceToDeduct] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  // Stats state
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [salaryPreview, setSalaryPreview] = useState<SalaryPreview | null>(null);

  // Get selected staff info
  const selectedStaff = staffList.find((s) => s.id === staffId);

  // Is this type a movement (accumulates) or actual payment?
  const isMovementType = MOVEMENT_TYPES.includes(type as any);
  const isSalaryType = type === "SALARY";
  const isAdvanceType = type === "ADVANCE";
  const isAdvanceReturnType = type === "ADVANCE_RETURN";

  // Calculate period based on staff's pay frequency
  const periodDates = selectedStaff
    ? calculatePeriodDates(new Date(movementDate), selectedStaff.payFrequency)
    : null;

  // Calculate amounts
  const amountNum = parseFloat(amount) || 0;
  const advanceDeductedNum = deductAdvance ? parseFloat(advanceToDeduct) || 0 : 0;

  // For salary, use the preview's gross and net
  const grossAmount = isSalaryType && salaryPreview
    ? salaryPreview.grossAmount
    : amountNum;
  const netAmount = isSalaryType && salaryPreview
    ? salaryPreview.grossAmount - advanceDeductedNum
    : amountNum - advanceDeductedNum;

  // Fetch stats when staff and period change (for SALARY type)
  const fetchStats = useCallback(async () => {
    if (!staffId || !periodDates || !isSalaryType) {
      setStats(null);
      setSalaryPreview(null);
      return;
    }

    setLoadingStats(true);
    try {
      const periodStart = format(periodDates.start, "yyyy-MM-dd");
      const periodEnd = format(periodDates.end, "yyyy-MM-dd");

      const response = await fetch(
        `/api/staff-payments/stats?staffId=${staffId}&periodStart=${periodStart}&periodEnd=${periodEnd}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setSalaryPreview(data.salaryPreview);

        // Pre-fill advance deduction suggestion
        if (data.salaryPreview.suggestedAdvanceDeduction > 0) {
          setAdvanceToDeduct(String(data.salaryPreview.suggestedAdvanceDeduction));
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [staffId, periodDates?.start.toISOString(), periodDates?.end.toISOString(), isSalaryType]);

  useEffect(() => {
    if (open && staffId && isSalaryType) {
      fetchStats();
    }
  }, [open, staffId, isSalaryType, movementDate, fetchStats]);

  // Pre-fill amount with base salary for SALARY type
  useEffect(() => {
    if (isSalaryType && salaryPreview) {
      setAmount(String(salaryPreview.baseSalaryPerPeriod));
    } else if (isSalaryType && selectedStaff?.baseSalary) {
      // Fallback if no preview yet
      setAmount(String(selectedStaff.baseSalary));
    }
  }, [isSalaryType, salaryPreview, selectedStaff]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStaffId("");
      setType("BONUS");
      setAmount("");
      setDescription("");
      setMovementDate(format(new Date(), "yyyy-MM-dd"));
      setDeductAdvance(false);
      setAdvanceToDeduct("");
      setPaymentDetails([]);
      setStats(null);
      setSalaryPreview(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!staffId || !amount || !description) {
      toast.error(t("errors.missingFields"));
      return;
    }

    // Validate advance deduction
    const advanceBalance = salaryPreview?.advanceBalance || selectedStaff?.advanceBalance || 0;
    if (deductAdvance && advanceDeductedNum > advanceBalance) {
      toast.error(t("errors.advanceExceedsBalance"));
      return;
    }

    // Validate payment details for actual payments
    if ((isSalaryType || isAdvanceType) && paymentDetails.length > 0) {
      const totalPayment = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(totalPayment - netAmount) > 0.01) {
        toast.error(t("errors.paymentMismatch"));
        return;
      }
    }

    setLoading(true);
    try {
      let body: any = {
        staffId,
        type,
        description,
      };

      if (isMovementType) {
        // Movement: BONUS, COMMISSION, BENEFIT, DEDUCTION
        body.amount = amountNum;
        body.movementDate = movementDate;
      } else if (isSalaryType) {
        // Salary payment
        body.periodStart = periodDates ? format(periodDates.start, "yyyy-MM-dd") : null;
        body.periodEnd = periodDates ? format(periodDates.end, "yyyy-MM-dd") : null;
        body.baseSalary = salaryPreview?.baseSalaryPerPeriod || amountNum;
        if (deductAdvance) {
          body.advanceDeducted = advanceDeductedNum;
        }
        if (paymentDetails.length > 0) {
          body.paymentDetails = paymentDetails;
        }
      } else if (isAdvanceType) {
        // Advance payment
        body.amount = amountNum;
        if (paymentDetails.length > 0) {
          body.paymentDetails = paymentDetails;
        }
      } else if (isAdvanceReturnType) {
        // Advance return
        body.amount = amountNum;
      }

      const response = await fetch("/api/staff-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      toast.success(t("createSuccess"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof Error) {
        switch (error.message) {
          case "SALARY_ALREADY_PAID_FOR_PERIOD":
            toast.error(t("errors.salaryAlreadyPaid"));
            break;
          case "PERIOD_ALREADY_PAID":
            toast.error(t("errors.periodAlreadyPaid"));
            break;
          case "ADVANCE_RETURN_EXCEEDS_BALANCE":
            toast.error(t("errors.advanceReturnExceedsBalance"));
            break;
          case "ADVANCE_DEDUCTION_EXCEEDS_BALANCE":
            toast.error(t("errors.advanceExceedsBalance"));
            break;
          default:
            toast.error(t("errors.createFailed"));
        }
      } else {
        toast.error(t("errors.createFailed"));
      }
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

  const formatPeriod = (start: Date, end: Date) => {
    return `${format(start, "d MMM", { locale: dateLocale })} - ${format(end, "d MMM yyyy", { locale: dateLocale })}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-teal-500" />
            {t("dialog.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                    <div className="flex items-center gap-2">
                      <span>{staff.name}</span>
                      {staff.advanceBalance > 0 && (
                        <Badge variant="outline" className="text-amber-600">
                          {t("dialog.advancePending")}: {formatCurrency(staff.advanceBalance)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>{t("dialog.type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as typeof type);
                // Reset amount when changing type
                setAmount("");
                setDeductAdvance(false);
                setAdvanceToDeduct("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {t("dialog.incomeTypes")}
                  </SelectLabel>
                  {INCOME_TYPES.map((paymentType) => (
                    <SelectItem key={paymentType} value={paymentType}>
                      <span className="flex items-center gap-2">
                        <Plus className="h-3 w-3 text-green-500" />
                        {t(`types.${paymentType}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 text-red-700">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {t("dialog.expenseTypes")}
                  </SelectLabel>
                  {EXPENSE_TYPES.map((paymentType) => (
                    <SelectItem key={paymentType} value={paymentType}>
                      <span className="flex items-center gap-2">
                        <Minus className="h-3 w-3 text-red-500" />
                        {t(`types.${paymentType}`)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection (for movements) */}
          {(isMovementType || isSalaryType) && (
            <div className="space-y-2">
              <Label>{isSalaryType ? t("filters.from") : t("table.date")}</Label>
              <Input
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
              />
              {periodDates && selectedStaff && (
                <p className="text-sm text-gray-500">
                  {t("dialog.periodInfo", {
                    month: "",
                    year: "",
                  }).replace("{month} {year}", formatPeriod(periodDates.start, periodDates.end))}
                </p>
              )}
            </div>
          )}

          {/* Salary Preview Card */}
          {isSalaryType && staffId && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                <TrendingUp className="h-4 w-4" />
                {periodDates && formatPeriod(periodDates.start, periodDates.end)}
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">
                        {t("dialog.sessionsCompleted")}:
                      </span>{" "}
                      <strong>{stats.sessionsCount}</strong>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {t("dialog.daysWithActivity")}:
                      </span>{" "}
                      <strong>
                        {stats.daysWithSessions}/{stats.totalWorkDays}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        {t("dialog.babyCardsSold")}:
                      </span>{" "}
                      <strong>{stats.babyCardsSold}</strong>
                    </div>
                    {stats.daysWithoutSessions.length > 0 && stats.daysWithoutSessions.length <= 5 && (
                      <div className="col-span-2">
                        <span className="text-amber-600">
                          <AlertCircle className="mr-1 inline h-3 w-3" />
                          {t("dialog.daysWithoutActivity")}:{" "}
                          {stats.daysWithoutSessions.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pending Movements Summary */}
                  {salaryPreview && (salaryPreview.movements.income.length > 0 || salaryPreview.movements.expenses.length > 0) && (
                    <div className="mt-3 space-y-2 border-t border-teal-200 pt-3">
                      <p className="text-xs font-medium text-teal-700">{t("dialog.pendingMovements")}:</p>
                      {salaryPreview.movements.income.map((m) => (
                        <div key={m.id} className="flex justify-between text-xs">
                          <span className="text-gray-600">{m.description}</span>
                          <span className="font-medium text-green-600">+{formatCurrency(m.grossAmount)}</span>
                        </div>
                      ))}
                      {salaryPreview.movements.expenses.map((m) => (
                        <div key={m.id} className="flex justify-between text-xs">
                          <span className="text-gray-600">{m.description}</span>
                          <span className="font-medium text-red-600">{formatCurrency(m.grossAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {/* Advance Balance Alert */}
              {salaryPreview && salaryPreview.advanceBalance > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-100 p-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    {t("dialog.advancePendingAlert", {
                      amount: formatCurrency(salaryPreview.advanceBalance),
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t("dialog.grossAmount")}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isSalaryType && !!salaryPreview}
            />
            {isSalaryType && salaryPreview && (
              <p className="text-xs text-gray-500">
                Base: {formatCurrency(salaryPreview.baseSalaryPerPeriod)} +
                Movimientos: {formatCurrency(salaryPreview.movements.totalIncome - salaryPreview.movements.totalExpenses)} =
                <strong> {formatCurrency(salaryPreview.grossAmount)}</strong>
              </p>
            )}
          </div>

          {/* Advance Deduction (for SALARY type when there's a balance) */}
          {isSalaryType && salaryPreview && salaryPreview.advanceBalance > 0 && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deductAdvance"
                  checked={deductAdvance}
                  onCheckedChange={(checked) => {
                    setDeductAdvance(!!checked);
                    if (checked) {
                      setAdvanceToDeduct(String(salaryPreview.suggestedAdvanceDeduction));
                    }
                  }}
                />
                <label
                  htmlFor="deductAdvance"
                  className="text-sm font-medium text-amber-800"
                >
                  {t("dialog.deductAdvance")}
                </label>
              </div>
              {deductAdvance && (
                <div className="space-y-2">
                  <Label className="text-sm text-amber-700">
                    {t("dialog.amountToDeduct")} ({t("dialog.max")}:{" "}
                    {formatCurrency(salaryPreview.advanceBalance)})
                  </Label>
                  <Input
                    type="number"
                    value={advanceToDeduct}
                    onChange={(e) => setAdvanceToDeduct(e.target.value)}
                    max={salaryPreview.advanceBalance}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          )}

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

          {/* Net Amount Display (for salary and advance) */}
          {(isSalaryType || isAdvanceType) && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t("dialog.netAmount")}:</span>
                <span className="text-2xl font-bold text-teal-600">
                  {formatCurrency(isSalaryType && salaryPreview ? salaryPreview.grossAmount - advanceDeductedNum : amountNum)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method (Split Payments) - only for actual money transfers */}
          {(isSalaryType || isAdvanceType) && (
            <div className="space-y-2">
              <SplitPaymentForm
                totalAmount={netAmount > 0 ? netAmount : amountNum}
                onPaymentDetailsChange={setPaymentDetails}
                currency={getCurrencySymbol(locale)}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !staffId || !amount || !description}
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
