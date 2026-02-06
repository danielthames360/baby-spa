"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
  type SpecialPriceInfo,
} from "@/components/packages/package-selector";

interface PackageStepProps {
  catalogPackages: PackageData[];
  babyPackages: PackagePurchaseData[];
  specialPrices?: SpecialPriceInfo[];
  selectedPackageId: string | null;
  selectedPurchaseId: string | null;
  loadingCatalog: boolean;
  babyId?: string;
  onSelectPackage: (packageId: string | null, purchaseId: string | null) => void;
}

export function PackageStep({
  catalogPackages,
  babyPackages,
  specialPrices,
  selectedPackageId,
  selectedPurchaseId,
  loadingCatalog,
  babyId,
  onSelectPackage,
}: PackageStepProps) {
  const t = useTranslations();

  if (loadingCatalog) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <PackageSelector
        babyId={babyId}
        packages={catalogPackages}
        babyPackages={babyPackages}
        specialPrices={specialPrices}
        selectedPackageId={selectedPackageId}
        selectedPurchaseId={selectedPurchaseId}
        onSelectPackage={onSelectPackage}
        showCategories={true}
        showPrices={true}
        showExistingFirst={true}
        allowNewPackage={true}
        compact={true}
        showProvisionalMessage={false}
        maxHeight="none"
      />
    </div>
  );
}
