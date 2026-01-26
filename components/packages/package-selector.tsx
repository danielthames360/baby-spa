"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
  Check,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
export interface Category {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

export interface PackageData {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryRef?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  sessionCount: number;
  basePrice: number | string;
  duration: number;
  requiresAdvancePayment: boolean;
  advancePaymentAmount: number | string | null;
}

export interface PackagePurchaseData {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
  package: {
    id: string;
    name: string;
    categoryId: string | null;
    categoryRef?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
    duration: number;
  };
}

export interface PackageSelectorProps {
  // Data
  babyId?: string;
  packages?: PackageData[];
  babyPackages?: PackagePurchaseData[];

  // State
  selectedPackageId?: string | null;
  selectedPurchaseId?: string | null;

  // Callbacks
  onSelectPackage: (packageId: string | null, purchaseId: string | null, packageName?: string) => void;
  onCatalogToggle?: (expanded: boolean) => void;

  // Options
  showCategories?: boolean;
  showPrices?: boolean;
  showExistingFirst?: boolean;
  allowNewPackage?: boolean;
  compact?: boolean;
  showProvisionalMessage?: boolean;
  defaultCategoryId?: string;
  maxHeight?: string;
  forceShowCatalog?: boolean; // Force catalog to be expanded (e.g., when catalog package is preselected)

  // Loading state
  isLoading?: boolean;
}

// Compact Package Option Component
interface PackageOptionProps {
  name: string;
  description?: string | null;
  sessions: number;
  duration: number;
  price?: number;
  remaining?: number;
  total?: number;
  selected?: boolean;
  requiresAdvance?: boolean;
  showPrice?: boolean;
  onClick: () => void;
}

function PackageOption({
  name,
  description,
  sessions,
  duration,
  price,
  remaining,
  total,
  selected,
  requiresAdvance,
  showPrice = true,
  onClick,
}: PackageOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border-2 transition-all cursor-pointer text-left p-3",
        selected
          ? "border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-sm"
          : "border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all mt-0.5",
            selected
              ? "border-teal-500 bg-teal-500"
              : "border-gray-300 group-hover:border-teal-300"
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>

        {/* Package info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-medium",
              selected ? "text-teal-800" : "text-gray-800"
            )}>
              {name}
            </span>
            {requiresAdvance && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                Anticipo
              </span>
            )}
          </div>

          {/* Description - shown inline */}
          {description && (
            <p className={cn(
              "mt-1 text-xs leading-relaxed line-clamp-2",
              selected ? "text-teal-600/80" : "text-gray-500"
            )}>
              {description}
            </p>
          )}

          {/* Compact badges */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={cn(
              "inline-flex items-center",
              selected ? "text-teal-600" : "text-gray-500"
            )}>
              <Sparkles className="mr-1 h-3 w-3" />
              {sessions} {sessions === 1 ? "sesión" : "sesiones"}
            </span>
            <span className="text-gray-300">•</span>
            <span className={cn(
              "inline-flex items-center",
              selected ? "text-teal-600" : "text-gray-500"
            )}>
              <Clock className="mr-1 h-3 w-3" />
              {duration} min
            </span>
            {remaining !== undefined && total !== undefined && (
              <>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center text-emerald-600 font-medium">
                  {remaining}/{total}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        {showPrice && price !== undefined && price > 0 && (
          <div className="shrink-0 text-right">
            <span className={cn(
              "font-bold",
              selected ? "text-teal-700" : "text-gray-700"
            )}>
              {price.toFixed(0)} Bs
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// Category Tab Button
interface CategoryTabProps {
  name: string;
  active: boolean;
  onClick: () => void;
}

function CategoryTab({ name, active, onClick }: CategoryTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
        active
          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
    >
      {name}
    </button>
  );
}

// Main Component
export function PackageSelector({
  babyId,
  packages: externalPackages,
  babyPackages: externalBabyPackages,
  selectedPackageId,
  selectedPurchaseId,
  onSelectPackage,
  onCatalogToggle,
  showCategories = true,
  showPrices = true,
  showExistingFirst = true,
  allowNewPackage = true,
  compact = false,
  showProvisionalMessage = true,
  defaultCategoryId,
  maxHeight = "300px",
  isLoading: externalLoading,
  forceShowCatalog = false,
}: PackageSelectorProps) {
  const t = useTranslations();

  // Internal state
  const [packages, setPackages] = useState<PackageData[]>(externalPackages || []);
  const [babyPackages, setBabyPackages] = useState<PackagePurchaseData[]>(externalBabyPackages || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(externalLoading ?? (!externalPackages));
  const [showCatalog, setShowCatalog] = useState(forceShowCatalog || !externalBabyPackages?.length);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(defaultCategoryId || "");

  // Track if we've done the initial category auto-selection (to avoid re-selecting on every render)
  const hasAutoSelectedCategory = useRef(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?type=PACKAGE");
      const data = await response.json();
      if (response.ok) {
        const fetchedCategories = data.categories || [];
        setCategories(fetchedCategories);
        // Only auto-select first category if:
        // 1. No active category is set
        // 2. No catalog package is preselected (selectedPackageId without selectedPurchaseId)
        const hasCatalogPackagePreselected = selectedPackageId && !selectedPurchaseId;
        if (fetchedCategories.length > 0 && !activeCategoryId && !hasCatalogPackagePreselected) {
          setActiveCategoryId(fetchedCategories[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [activeCategoryId, selectedPackageId, selectedPurchaseId]);

  // Fetch packages if not provided
  const fetchPackages = useCallback(async () => {
    if (externalPackages) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/packages?active=true");
      const data = await response.json();
      if (response.ok) {
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [externalPackages]);

  // Fetch baby packages if babyId provided
  const fetchBabyPackages = useCallback(async () => {
    if (!babyId || externalBabyPackages) return;

    try {
      const response = await fetch(`/api/babies/${babyId}/packages`);
      const data = await response.json();
      if (response.ok) {
        setBabyPackages(data.packages || []);
        if (data.packages?.length > 0) {
          setShowCatalog(false);
        }
      }
    } catch (error) {
      console.error("Error fetching baby packages:", error);
    }
  }, [babyId, externalBabyPackages]);

  useEffect(() => {
    fetchPackages();
    fetchBabyPackages();
    fetchCategories();
  }, [fetchPackages, fetchBabyPackages, fetchCategories]);

  // Update from external props
  useEffect(() => {
    if (externalPackages) setPackages(externalPackages);
  }, [externalPackages]);

  useEffect(() => {
    if (externalBabyPackages) {
      setBabyPackages(externalBabyPackages);
      // Only set showCatalog on initial load, not on every update
      // This prevents closing the catalog when user selects a package
    }
  }, [externalBabyPackages]);

  // Set initial showCatalog state based on whether baby has packages or forceShowCatalog
  useEffect(() => {
    if (forceShowCatalog) {
      setShowCatalog(true);
    } else if (externalBabyPackages !== undefined) {
      setShowCatalog(!externalBabyPackages.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBabyPackages?.length, forceShowCatalog]);

  // Auto-select category based on selectedPackageId (for catalog packages) - only once on mount
  useEffect(() => {
    if (
      selectedPackageId &&
      !selectedPurchaseId &&
      packages.length > 0 &&
      categories.length > 0 &&
      !hasAutoSelectedCategory.current
    ) {
      const selectedPkg = packages.find((pkg) => pkg.id === selectedPackageId);
      if (selectedPkg?.categoryId) {
        // Verify the category exists
        const categoryExists = categories.some((cat) => cat.id === selectedPkg.categoryId);
        if (categoryExists) {
          setActiveCategoryId(selectedPkg.categoryId);
          hasAutoSelectedCategory.current = true;
        }
      }
    }
  }, [selectedPackageId, selectedPurchaseId, packages, categories]);

  // Get categories that have packages
  const availableCategories = categories.filter((cat) =>
    packages.some((pkg) => pkg.categoryId === cat.id)
  );

  // Auto-switch to a category that has packages if current category is empty
  useEffect(() => {
    if (packages.length > 0 && categories.length > 0) {
      const currentCategoryHasPackages = packages.some(
        (pkg) => pkg.categoryId === activeCategoryId
      );
      if (!currentCategoryHasPackages && availableCategories.length > 0) {
        // Switch to first category that has packages
        setActiveCategoryId(availableCategories[0].id);
      }
    }
  }, [packages, categories, activeCategoryId, availableCategories]);

  // Filter packages by category
  const filteredPackages = activeCategoryId
    ? packages.filter((pkg) => pkg.categoryId === activeCategoryId)
    : packages;

  // Handle selection
  const handleSelectPurchase = (purchase: PackagePurchaseData) => {
    onSelectPackage(purchase.package.id, purchase.id, purchase.package.name);
  };

  const handleSelectPackage = (pkg: PackageData) => {
    onSelectPackage(pkg.id, null, pkg.name);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Existing baby packages */}
      {showExistingFirst && babyPackages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-gray-700">
              {t("packages.yourPackages")}
            </span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">
              {babyPackages.reduce((sum, p) => sum + p.remainingSessions, 0)} disponibles
            </Badge>
          </div>

          <div className="space-y-2">
            {babyPackages
              .filter((p) => p.remainingSessions > 0)
              .map((purchase) => (
                <PackageOption
                  key={purchase.id}
                  name={purchase.package.name}
                  sessions={purchase.totalSessions}
                  duration={purchase.package.duration}
                  remaining={purchase.remainingSessions}
                  total={purchase.totalSessions}
                  selected={selectedPurchaseId === purchase.id}
                  showPrice={false}
                  onClick={() => handleSelectPurchase(purchase)}
                />
              ))}
          </div>

          {allowNewPackage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newState = !showCatalog;
                setShowCatalog(newState);
                if (newState) {
                  onCatalogToggle?.(true);
                }
              }}
              className="w-full justify-between text-teal-600 hover:bg-teal-50 hover:text-teal-700 h-8 text-xs"
            >
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {t("packages.selectDifferent")}
              </span>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                showCatalog && "rotate-90"
              )} />
            </Button>
          )}
        </div>
      )}

      {/* Package catalog */}
      {(showCatalog || !babyPackages.length) && allowNewPackage && (
        <div className="space-y-2">
          {babyPackages.length > 0 && (
            <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
              <Sparkles className="h-4 w-4 text-teal-500" />
              <span className="font-medium text-gray-700">
                {t("packages.catalog")}
              </span>
            </div>
          )}

          {/* Category tabs - horizontal scroll */}
          {showCategories && availableCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {availableCategories.map((category) => (
                <CategoryTab
                  key={category.id}
                  name={category.name}
                  active={activeCategoryId === category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                />
              ))}
            </div>
          )}

          {/* Package list with scroll */}
          <div
            className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
            style={{ maxHeight }}
          >
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => (
                <PackageOption
                  key={pkg.id}
                  name={pkg.name}
                  description={pkg.description}
                  sessions={pkg.sessionCount}
                  duration={pkg.duration}
                  price={typeof pkg.basePrice === "string" ? parseFloat(pkg.basePrice) : pkg.basePrice}
                  selected={selectedPackageId === pkg.id && !selectedPurchaseId}
                  requiresAdvance={pkg.requiresAdvancePayment}
                  showPrice={showPrices}
                  onClick={() => handleSelectPackage(pkg)}
                />
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-400">
                No hay paquetes en esta categoría
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provisional message - more compact */}
      {showProvisionalMessage && (selectedPackageId || selectedPurchaseId) && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50/80 px-3 py-2 text-xs">
          <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-blue-600">{t("packages.provisional")}</p>
        </div>
      )}

      {/* No packages available */}
      {packages.length === 0 && babyPackages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Package className="h-10 w-10 text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">{t("packages.noPackagesAvailable")}</p>
        </div>
      )}
    </div>
  );
}

export default PackageSelector;
