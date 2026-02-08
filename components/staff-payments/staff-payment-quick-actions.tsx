"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Gift,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

// Dynamic imports for heavy dialogs (bundle-dynamic-imports)
const MovementDialog = dynamic(
  () => import("./movement-dialog").then((m) => m.MovementDialog),
  { ssr: false }
);
const SalaryDrawer = dynamic(
  () => import("./salary-drawer").then((m) => m.SalaryDrawer),
  { ssr: false }
);
const AdvanceDialog = dynamic(
  () => import("./advance-dialog").then((m) => m.AdvanceDialog),
  { ssr: false }
);

type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  payFrequency: PayFrequency;
  advanceBalance: number;
}

interface StaffPaymentQuickActionsProps {
  locale: string;
  staffList: StaffMember[];
}

export function StaffPaymentQuickActions({
  locale,
  staffList,
}: StaffPaymentQuickActionsProps) {
  const t = useTranslations("staffPayments");

  const [movementOpen, setMovementOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceReturnOpen, setAdvanceReturnOpen] = useState(false);

  const actions = [
    {
      id: "movement",
      icon: Gift,
      title: t("quickActions.movement"),
      description: t("quickActions.movementDesc"),
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-900",
      descColor: "text-emerald-600",
      hoverBorder: "hover:border-emerald-300",
      onClick: () => setMovementOpen(true),
    },
    {
      id: "salary",
      icon: Banknote,
      title: t("quickActions.salary"),
      description: t("quickActions.salaryDesc"),
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      textColor: "text-teal-900",
      descColor: "text-teal-600",
      hoverBorder: "hover:border-teal-300",
      onClick: () => setSalaryOpen(true),
    },
    {
      id: "advance",
      icon: ArrowUpCircle,
      title: t("quickActions.advance"),
      description: t("quickActions.advanceDesc"),
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-900",
      descColor: "text-amber-600",
      hoverBorder: "hover:border-amber-300",
      onClick: () => setAdvanceOpen(true),
    },
    {
      id: "advanceReturn",
      icon: ArrowDownCircle,
      title: t("quickActions.advanceReturn"),
      description: t("quickActions.advanceReturnDesc"),
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      textColor: "text-rose-900",
      descColor: "text-rose-600",
      hoverBorder: "hover:border-rose-300",
      onClick: () => setAdvanceReturnOpen(true),
    },
  ];

  return (
    <>
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 ${action.bgColor} ${action.borderColor} ${action.hoverBorder} p-4 text-left transition-all hover:shadow-md`}
            >
              <div className="relative">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg}`}>
                  <Icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <h3 className={`font-semibold ${action.textColor}`}>{action.title}</h3>
                <p className={`mt-1 text-xs ${action.descColor}`}>{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dialogs */}
      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        locale={locale}
        staffList={staffList}
      />

      <SalaryDrawer
        open={salaryOpen}
        onOpenChange={setSalaryOpen}
        locale={locale}
        staffList={staffList}
      />

      <AdvanceDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        locale={locale}
        staffList={staffList}
        type="ADVANCE"
      />

      <AdvanceDialog
        open={advanceReturnOpen}
        onOpenChange={setAdvanceReturnOpen}
        locale={locale}
        staffList={staffList}
        type="ADVANCE_RETURN"
      />
    </>
  );
}
