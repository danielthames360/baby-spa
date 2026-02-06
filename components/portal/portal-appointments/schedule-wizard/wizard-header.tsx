"use client";

import { useTranslations } from "next-intl";
import { Baby, ChevronLeft, UserRound } from "lucide-react";
import type { WizardStep, BabyData, ParentInfo } from "../types";

interface WizardHeaderProps {
  step: WizardStep;
  clientType: "baby" | "self" | null;
  selectedBaby: BabyData | null;
  parentInfo: ParentInfo | null;
  canGoBack: boolean;
  onBack: () => void;
  getStepNumber: () => number;
  getTotalSteps: () => number;
}

export function WizardHeader({
  step,
  clientType,
  selectedBaby,
  parentInfo,
  canGoBack,
  onBack,
  getStepNumber,
  getTotalSteps,
}: WizardHeaderProps) {
  const t = useTranslations();

  if (step === "success") {
    return null;
  }

  return (
    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:rounded-t-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {(step === "baby" ||
            step === "package" ||
            step === "preferences" ||
            step === "datetime") &&
            canGoBack && (
              <button
                onClick={onBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {step === "client" &&
                t("portal.appointments.wizard.selectClientType")}
              {step === "baby" && t("portal.appointments.selectBaby")}
              {step === "package" && t("packages.selectPackage")}
              {step === "preferences" &&
                t("portal.appointments.wizard.schedulePreferences")}
              {step === "datetime" &&
                t("portal.appointments.wizard.selectDateTime")}
              {step === "payment" && t("payment.required")}
            </h2>
            {step !== "client" &&
              step !== "baby" &&
              step !== "payment" && (
                <p className="text-xs text-gray-500">
                  {t("portal.appointments.wizard.step")} {getStepNumber()}{" "}
                  {t("portal.appointments.wizard.of")} {getTotalSteps()}
                </p>
              )}
          </div>
        </div>
        {/* Client indicator */}
        {clientType === "self" && step !== "client" && (
          <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1">
            <UserRound className="h-4 w-4 text-rose-600" />
            <span className="text-sm font-medium text-rose-700">
              {parentInfo?.name}
            </span>
          </div>
        )}
        {selectedBaby && step !== "baby" && step !== "client" && (
          <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1">
            <Baby className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">
              {selectedBaby.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
