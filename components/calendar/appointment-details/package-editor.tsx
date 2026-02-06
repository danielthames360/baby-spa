"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import type { AppointmentData } from "./types";

interface PackageEditorProps {
  appointment: AppointmentData;
  catalogPackages: PackageData[];
  babyPackages: PackagePurchaseData[];
  selectedPackageId: string | null;
  selectedPurchaseId: string | null;
  isSaving: boolean;
  error: string | null;
  onSelectPackage: (packageId: string | null, purchaseId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PackageEditor({
  appointment,
  catalogPackages,
  babyPackages,
  selectedPackageId,
  selectedPurchaseId,
  isSaving,
  error,
  onSelectPackage,
  onSave,
  onCancel,
}: PackageEditorProps) {
  const t = useTranslations();

  return (
    <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t("calendar.changePackage")}
        </p>
      </div>
      <PackageSelector
        babyId={appointment.baby?.id || ""}
        packages={catalogPackages}
        babyPackages={babyPackages}
        selectedPackageId={selectedPackageId}
        selectedPurchaseId={selectedPurchaseId}
        onSelectPackage={onSelectPackage}
        showCategories={true}
        showPrices={false}
        showExistingFirst={true}
        allowNewPackage={true}
        compact={true}
        showProvisionalMessage={false}
        maxHeight="200px"
        forceShowCatalog={!!appointment.selectedPackage && !appointment.packagePurchase}
      />
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
          <AlertCircle className="h-3 w-3" />
          {t(`calendar.errors.${error}`)}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8">
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving || (!selectedPackageId && !selectedPurchaseId)}
          className="h-8 bg-teal-600 text-white hover:bg-teal-700"
        >
          {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
