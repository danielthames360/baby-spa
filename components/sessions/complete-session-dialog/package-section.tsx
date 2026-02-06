"use client";

import { useTranslations } from "next-intl";
import { Loader2, Package } from "lucide-react";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";
import type { SessionData } from "./types";

interface PackageSectionProps {
  session: SessionData;
  packages: PackageData[];
  babyPackages: PackagePurchaseData[];
  selectedPackageId: string | null;
  selectedPurchaseId: string | null;
  isLoadingBabyPackages: boolean;
  onSelectPackage: (
    pkgId: string | null,
    purchaseId: string | null,
    purchaseName?: string
  ) => void;
}

export function PackageSection({
  session,
  packages,
  babyPackages,
  selectedPackageId,
  selectedPurchaseId,
  isLoadingBabyPackages,
  onSelectPackage,
}: PackageSectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
        <Package className="h-5 w-5 text-teal-600" />
        {t("session.selectPackage")}
      </h3>

      {!isLoadingBabyPackages && (
        <PackageSelector
          babyId={
            session.appointment.baby?.id || session.appointment.parent?.id || ""
          }
          packages={packages}
          babyPackages={babyPackages}
          selectedPackageId={selectedPackageId}
          selectedPurchaseId={selectedPurchaseId}
          onSelectPackage={(pkgId, purchaseId, purchaseName) => {
            onSelectPackage(pkgId, purchaseId, purchaseName);
          }}
          defaultCategoryId={
            session.appointment.selectedPackage?.categoryId || undefined
          }
          showCategories={true}
          showPrices={true}
          showExistingFirst={true}
          allowNewPackage={true}
          compact={true}
          showProvisionalMessage={false}
          forceShowCatalog={
            !!session.appointment.selectedPackageId && !session.packagePurchaseId
          }
          maxHeight="250px"
        />
      )}
      {isLoadingBabyPackages && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      )}
    </div>
  );
}
