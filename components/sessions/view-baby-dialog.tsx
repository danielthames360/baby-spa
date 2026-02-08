"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Info,
  AlertTriangle,
  Stethoscope,
  Heart,
  ShieldAlert,
  User,
  FileText,
} from "lucide-react";
import { calculateExactAge, formatAge } from "@/lib/utils/age";

interface ViewBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baby: {
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    birthWeeks?: number | null;
    birthWeight?: number | string | null;
    birthType?: string | null;
    birthDifficulty?: boolean;
    birthDifficultyDesc?: string | null;
    diagnosedIllness?: boolean;
    diagnosedIllnessDesc?: string | null;
    allergies?: string | null;
    specialObservations?: string | null;
    parents?: Array<{
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
      };
    }>;
  } | null;
}

function SectionTitle({
  icon: Icon,
  children,
  variant = "default",
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  variant?: "default" | "alert";
}) {
  return (
    <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          variant === "alert"
            ? "bg-gradient-to-br from-rose-100 to-amber-100"
            : "bg-gradient-to-br from-teal-100 to-cyan-100"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${variant === "alert" ? "text-rose-500" : "text-teal-600"}`}
        />
      </div>
      <h3
        className={`font-semibold ${variant === "alert" ? "text-rose-700" : "text-gray-700"}`}
      >
        {children}
      </h3>
    </div>
  );
}

export function ViewBabyDialog({
  open,
  onOpenChange,
  baby,
}: ViewBabyDialogProps) {
  const t = useTranslations();

  if (!baby) return null;

  const ageResult = calculateExactAge(baby.birthDate);
  const age = formatAge(ageResult, t);

  const primaryParent =
    baby.parents?.find((p) => p.isPrimary)?.parent || baby.parents?.[0]?.parent;

  const hasMedicalAlerts =
    baby.allergies || baby.diagnosedIllness || baby.birthDifficulty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
              <Baby className="h-5 w-5 text-white" />
            </div>
            {baby.name}
            <span className="text-sm text-gray-500">{age}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <SectionTitle icon={Info}>
              {t("babyProfile.info.basicInfo")}
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{t("baby.gender")}</p>
                <p className="font-medium text-gray-800">
                  {t(`baby.${baby.gender.toLowerCase()}`)}
                </p>
              </div>
              {baby.birthWeeks && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    {t("baby.birthWeeks")}
                  </p>
                  <p className="font-medium text-gray-800">
                    {t("age.weeks", { count: baby.birthWeeks })}
                  </p>
                </div>
              )}
              {baby.birthWeight && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    {t("baby.birthWeight")}
                  </p>
                  <p className="font-medium text-gray-800">
                    {baby.birthWeight} kg
                  </p>
                </div>
              )}
              {baby.birthType && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t("baby.birthType")}</p>
                  <p className="font-medium text-gray-800">
                    {t(`baby.${baby.birthType.toLowerCase()}`)}
                  </p>
                </div>
              )}
            </div>

            {primaryParent && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-50 p-3">
                <User className="h-4 w-4 text-teal-500" />
                <span className="text-sm text-gray-600">
                  {t("babyProfile.info.primaryContact")}:
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {primaryParent.name}
                </span>
              </div>
            )}

            {baby.specialObservations && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600">
                    {t("babyForm.babyData.specialObservations")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {baby.specialObservations}
                </p>
              </div>
            )}
          </div>

          {/* Medical Alerts */}
          {hasMedicalAlerts && (
            <div className="space-y-3">
              <SectionTitle icon={ShieldAlert} variant="alert">
                {t("babyProfile.info.medicalAlerts")}
              </SectionTitle>
              <p className="text-xs text-rose-500/70">
                {t("babyProfile.info.medicalAlertsDescription")}
              </p>

              <div className="space-y-2">
                {/* Allergies */}
                {baby.allergies && (
                  <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100/80">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rose-600">
                        {t("babyProfile.info.alertAllergies")}
                      </p>
                      <p className="text-sm text-rose-800">{baby.allergies}</p>
                    </div>
                  </div>
                )}

                {/* Diagnosed Illness */}
                {baby.diagnosedIllness && (
                  <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100/80">
                      <Stethoscope className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-600">
                        {t("babyProfile.info.alertDiagnosedIllness")}
                      </p>
                      {baby.diagnosedIllnessDesc && (
                        <p className="text-sm text-amber-800">
                          {baby.diagnosedIllnessDesc}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Birth Difficulty */}
                {baby.birthDifficulty && (
                  <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100/80">
                      <Heart className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-600">
                        {t("babyProfile.info.alertBirthDifficulty")}
                      </p>
                      {baby.birthDifficultyDesc && (
                        <p className="text-sm text-orange-800">
                          {baby.birthDifficultyDesc}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Medical Alerts */}
          {!hasMedicalAlerts && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {t("babyProfile.info.noMedicalAlerts")}
              </Badge>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white"
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
