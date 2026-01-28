"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

// Constants outside component - Separated by income/expense for the employee
const INCOME_TYPES = [
  "SALARY",
  "COMMISSION",
  "BONUS",
  "BENEFIT",
  "SETTLEMENT",
  "ADVANCE",
] as const;

const EXPENSE_TYPES = [
  "DEDUCTION",
  "ADVANCE_RETURN",
] as const;

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: string;
  advanceBalance: number;
}

interface StaffPaymentFiltersProps {
  locale: string;
  staffList: StaffMember[];
  initialFilters: {
    staffId?: string;
    type?: string;
    status?: string;
    from?: string;
    to?: string;
  };
}

export function StaffPaymentFilters({
  locale,
  staffList,
  initialFilters,
}: StaffPaymentFiltersProps) {
  const t = useTranslations("staffPayments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [staffId, setStaffId] = useState(initialFilters.staffId || "");
  const [type, setType] = useState(initialFilters.type || "");
  const [status, setStatus] = useState(initialFilters.status || "");
  const [from, setFrom] = useState(initialFilters.from || "");
  const [to, setTo] = useState(initialFilters.to || "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);

    // Clear page when filters change
    params.delete("page");

    // Set or delete each filter
    if (staffId) params.set("staffId", staffId);
    else params.delete("staffId");

    if (type) params.set("type", type);
    else params.delete("type");

    if (status) params.set("status", status);
    else params.delete("status");

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    router.push(`/${locale}/admin/staff-payments?${params.toString()}`);
  }, [locale, router, searchParams, staffId, type, status, from, to]);

  const clearFilters = useCallback(() => {
    setStaffId("");
    setType("");
    setStatus("");
    setFrom("");
    setTo("");
    router.push(`/${locale}/admin/staff-payments`);
  }, [locale, router]);

  const hasFilters = staffId || type || status || from || to;

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Staff Filter */}
        <Select value={staffId} onValueChange={setStaffId}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.staff")} />
          </SelectTrigger>
          <SelectContent>
            {staffList.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                {staff.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.type")} />
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
                    <span className="h-2 w-2 rounded-full bg-green-400" />
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
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    {t(`types.${paymentType}`)}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {t("status.PENDING")}
              </span>
            </SelectItem>
            <SelectItem value="PAID">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {t("status.PAID")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder={t("filters.from")}
        />

        {/* Date To */}
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={t("filters.to")}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            {tCommon("clear")}
          </Button>
        )}
        <Button onClick={applyFilters}>
          <Search className="mr-2 h-4 w-4" />
          {tCommon("filter")}
        </Button>
      </div>
    </div>
  );
}
