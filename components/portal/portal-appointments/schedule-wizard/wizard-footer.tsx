"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardStep } from "../types";

interface WizardFooterProps {
  step: WizardStep;
  canProceed: boolean;
  submitting: boolean;
  autoScheduling: boolean;
  submitError: string | null;
  buttonAnimated: boolean;
  selectedPackageId: string | null;
  selectedPurchaseId: string | null;
  wantsFixedSchedule: boolean | null;
  schedulePreferencesCount: number;
  onSubmit: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function WizardFooter({
  step,
  canProceed,
  submitting,
  autoScheduling,
  submitError,
  buttonAnimated,
  selectedPackageId,
  selectedPurchaseId,
  wantsFixedSchedule,
  schedulePreferencesCount,
  onSubmit,
  onNext,
  onClose,
}: WizardFooterProps) {
  const t = useTranslations();

  // Payment footer
  if (step === "payment") {
    return (
      <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:rounded-b-2xl">
        <Button
          onClick={onClose}
          className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600"
        >
          <CheckCircle className="h-5 w-5" />
          {t("payment.understood")}
        </Button>
      </div>
    );
  }

  // Don't show footer for success, client, or baby steps
  if (step === "success" || step === "client" || step === "baby") {
    return null;
  }

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:rounded-b-2xl">
      {/* Error message */}
      {submitError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      {/* Provisional message */}
      {step === "package" &&
        (selectedPackageId || selectedPurchaseId) &&
        !submitError && (
          <p className="mb-3 text-center text-xs text-gray-500">
            {t("packages.provisional")}
          </p>
        )}

      {/* Preferences info message */}
      {step === "preferences" &&
        wantsFixedSchedule &&
        schedulePreferencesCount > 0 &&
        !submitError && (
          <p className="mb-3 text-center text-xs text-gray-500">
            {t("portal.appointments.wizard.preferencesWillBeSaved")}
          </p>
        )}

      <Button
        onClick={step === "datetime" ? onSubmit : onNext}
        disabled={!canProceed || submitting || autoScheduling}
        className={cn(
          "h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:shadow-none",
          canProceed && buttonAnimated && "animate-pulse-subtle"
        )}
      >
        {submitting || autoScheduling ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : step === "datetime" ? (
          <>
            <CheckCircle className="h-5 w-5" />
            {t("portal.appointments.confirmAppointment")}
          </>
        ) : step === "preferences" &&
          wantsFixedSchedule === true &&
          schedulePreferencesCount > 0 ? (
          <>
            <CheckCircle className="h-5 w-5" />
            {t("portal.appointments.confirmAppointment")}
          </>
        ) : (
          <>
            {t("common.continue")}
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}
