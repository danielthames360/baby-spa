"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCashRegister } from "@/hooks/use-cash-register";
import { CircleDollarSign, AlertTriangle, Plus, X } from "lucide-react";
import { OpenCashRegisterModal } from "./open-cash-register-modal";
import { CloseCashRegisterModal } from "./close-cash-register-modal";
import { AddExpenseModal } from "./add-expense-modal";
import { cn } from "@/lib/utils";

interface CashRegisterHeaderIndicatorProps {
  userRole: string;
}

export function CashRegisterHeaderIndicator({
  userRole,
}: CashRegisterHeaderIndicatorProps) {
  const t = useTranslations("cashRegister");
  const { cashRegister, isLoading, isOpen } = useCashRegister();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Only show for RECEPTION role
  if (userRole !== "RECEPTION") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-500">
        <CircleDollarSign className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">...</span>
      </div>
    );
  }

  // Cash register is OPEN
  if (isOpen && cashRegister) {
    const openedTime = new Date(cashRegister.openedAt).toLocaleTimeString(
      "es-ES",
      { hour: "2-digit", minute: "2-digit" }
    );

    return (
      <>
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <div className="relative">
              <CircleDollarSign className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="hidden sm:inline">
              {t("header.open", { time: openedTime })}
            </span>
          </div>

          {/* Add expense button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExpenseModal(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">{t("addExpense")}</span>
          </Button>

          {/* Close cash register button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloseModal(true)}
            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            <span className="hidden md:inline">{t("close")}</span>
          </Button>
        </div>

        <AddExpenseModal
          open={showExpenseModal}
          onOpenChange={setShowExpenseModal}
        />
        <CloseCashRegisterModal
          open={showCloseModal}
          onOpenChange={setShowCloseModal}
        />
      </>
    );
  }

  // Cash register is NOT OPEN - show warning
  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
            "bg-amber-100 text-amber-700"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">{t("header.closed")}</span>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setShowOpenModal(true)}
          className="gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500"
        >
          <CircleDollarSign className="h-4 w-4" />
          <span>{t("open")}</span>
        </Button>
      </div>

      <OpenCashRegisterModal
        open={showOpenModal}
        onOpenChange={setShowOpenModal}
      />
    </>
  );
}
