"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { es, ptBR } from "date-fns/locale";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Loader2,
  Banknote,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
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
  paymentMethod: "CASH" | "QR" | "CARD" | "TRANSFER";
  reference?: string;
}

interface SalaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  staffList: StaffMember[];
}

// Helper to calculate period dates based on frequency
function calculatePeriodDates(date: Date, frequency: PayFrequency): { start: Date; end: Date } {
  switch (frequency) {
    case "DAILY":
      return { start: date, end: date };
    case "WEEKLY": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
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

export function SalaryDrawer({
  open,
  onOpenChange,
  locale,
  staffList,
}: SalaryDrawerProps) {
  const t = useTranslations("staffPayments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dateLocale = locale === "pt-BR" ? ptBR : es;

  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state
  const [staffId, setStaffId] = useState("");
  const [periodDate, setPeriodDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [deductAdvance, setDeductAdvance] = useState(false);
  const [advanceToDeduct, setAdvanceToDeduct] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);

  // Preview state
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [salaryPreview, setSalaryPreview] = useState<SalaryPreview | null>(null);

  // Get selected staff info
  const selectedStaff = staffList.find((s) => s.id === staffId);

  // Calculate period based on staff's pay frequency
  const periodDates = selectedStaff
    ? calculatePeriodDates(new Date(periodDate), selectedStaff.payFrequency)
    : null;

  // Calculate amounts
  const advanceDeductedNum = deductAdvance ? parseFloat(advanceToDeduct) || 0 : 0;
  const netAmount = salaryPreview
    ? salaryPreview.grossAmount - advanceDeductedNum
    : 0;

  // Fetch preview when staff and period change
  const fetchPreview = useCallback(async () => {
    if (!staffId || !periodDates) {
      setStats(null);
      setSalaryPreview(null);
      return;
    }

    setLoadingPreview(true);
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

        // Generate default description
        const staff = staffList.find((s) => s.id === staffId);
        if (staff) {
          const periodLabel = formatPeriod(periodDates.start, periodDates.end);
          setDescription(`${t("types.SALARY")} - ${periodLabel}`);
        }
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
    } finally {
      setLoadingPreview(false);
    }
  }, [staffId, periodDates?.start.toISOString(), periodDates?.end.toISOString(), staffList, t]);

  useEffect(() => {
    if (open && staffId) {
      fetchPreview();
    }
  }, [open, staffId, periodDate, fetchPreview]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setStaffId("");
      setPeriodDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setDeductAdvance(false);
      setAdvanceToDeduct("");
      setPaymentDetails([]);
      setStats(null);
      setSalaryPreview(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!staffId || !description || !periodDates) {
      toast.error(t("errors.missingFields"));
      return;
    }

    // Validate advance deduction
    if (deductAdvance && salaryPreview && advanceDeductedNum > salaryPreview.advanceBalance) {
      toast.error(t("errors.advanceExceedsBalance"));
      return;
    }

    // Validate payment details
    if (paymentDetails.length > 0) {
      const totalPayment = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(totalPayment - netAmount) > 0.01) {
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
          type: "SALARY",
          periodStart: format(periodDates.start, "yyyy-MM-dd"),
          periodEnd: format(periodDates.end, "yyyy-MM-dd"),
          baseSalary: salaryPreview?.baseSalaryPerPeriod || 0,
          advanceDeducted: deductAdvance ? advanceDeductedNum : undefined,
          description,
          paymentDetails: paymentDetails.length > 0 ? paymentDetails : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "SALARY_ALREADY_PAID_FOR_PERIOD") {
          toast.error(t("errors.salaryAlreadyPaid"));
        } else {
          toast.error(t("errors.createFailed"));
        }
        return;
      }

      toast.success(t("createSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating salary:", error);
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

  const formatPeriod = (start: Date, end: Date) => {
    return `${format(start, "d MMM", { locale: dateLocale })} - ${format(end, "d MMM yyyy", { locale: dateLocale })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-teal-500" />
            {t("quickActions.salary")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Staff */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                1
              </span>
              {t("dialog.staff")}
            </Label>
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
                          {formatCurrency(staff.advanceBalance)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Period */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                2
              </span>
              {t("salaryDrawer.selectPeriod")}
            </Label>
            <Input
              type="date"
              value={periodDate}
              onChange={(e) => setPeriodDate(e.target.value)}
            />
            {periodDates && selectedStaff && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatPeriod(periodDates.start, periodDates.end)}</span>
                <Badge variant="secondary" className="text-xs">
                  {t(`payFrequency.${selectedStaff.payFrequency}`)}
                </Badge>
              </div>
            )}
          </div>

          {/* Step 3: Preview (when staff is selected) */}
          {staffId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  3
                </span>
                {t("salaryDrawer.preview")}
              </Label>

              {loadingPreview ? (
                <div className="flex items-center justify-center rounded-xl border border-teal-100 bg-teal-50/50 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : salaryPreview ? (
                <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                  {/* Stats */}
                  {stats && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-teal-600" />
                      <span className="text-gray-600">
                        {stats.sessionsCount} {t("dialog.sessionsCompleted").toLowerCase()}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {stats.daysWithSessions}/{stats.totalWorkDays} {t("dialog.daysWithActivity").toLowerCase()}
                      </span>
                    </div>
                  )}

                  {/* Salary Breakdown */}
                  <div className="space-y-2 rounded-lg bg-white p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t("salaryDrawer.baseSalary")}</span>
                      <span className="font-medium">{formatCurrency(salaryPreview.baseSalaryPerPeriod)}</span>
                    </div>

                    {salaryPreview.movements.income.length > 0 && (
                      <>
                        <div className="my-2 border-t" />
                        {salaryPreview.movements.income.map((m) => (
                          <div key={m.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{m.description}</span>
                            <span className="font-medium text-green-600">+{formatCurrency(m.grossAmount)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {salaryPreview.movements.expenses.length > 0 && (
                      <>
                        <div className="my-2 border-t" />
                        {salaryPreview.movements.expenses.map((m) => (
                          <div key={m.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{m.description}</span>
                            <span className="font-medium text-red-600">{formatCurrency(m.grossAmount)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="my-2 border-t border-teal-200" />
                    <div className="flex justify-between font-semibold">
                      <span>{t("salaryDrawer.grossTotal")}</span>
                      <span className="text-teal-700">{formatCurrency(salaryPreview.grossAmount)}</span>
                    </div>
                  </div>

                  {/* Advance Deduction */}
                  {salaryPreview.advanceBalance > 0 && (
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          {t("dialog.advancePendingAlert", {
                            amount: formatCurrency(salaryPreview.advanceBalance),
                          })}
                        </span>
                      </div>
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
                          className="text-sm text-amber-800"
                        >
                          {t("dialog.deductAdvance")}
                        </label>
                      </div>
                      {deductAdvance && (
                        <Input
                          type="number"
                          value={advanceToDeduct}
                          onChange={(e) => setAdvanceToDeduct(e.target.value)}
                          max={salaryPreview.advanceBalance}
                          min="0"
                          step="0.01"
                          className="bg-white"
                        />
                      )}
                    </div>
                  )}

                  {/* Net Amount */}
                  <div className="flex items-center justify-between rounded-lg bg-teal-600 p-4 text-white">
                    <span className="font-medium">{t("dialog.netAmount")}</span>
                    <span className="text-2xl font-bold">{formatCurrency(netAmount)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Step 4: Payment Details */}
          {salaryPreview && netAmount > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  4
                </span>
                {t("dialog.paymentMethod")}
              </Label>
              <SplitPaymentForm
                totalAmount={netAmount}
                onPaymentDetailsChange={setPaymentDetails}
                currency={getCurrencySymbol(locale)}
              />
            </div>
          )}

          {/* Description */}
          {salaryPreview && (
            <div className="space-y-2">
              <Label>{t("dialog.description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !staffId || !salaryPreview || !description}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {t("salaryDrawer.paySalary")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
