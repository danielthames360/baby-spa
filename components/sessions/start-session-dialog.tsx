"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  AlertCircle,
  Play,
  Baby,
  User,
  Package,
  Sparkles,
  Info,
} from "lucide-react";

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  babyId: string;
  babyName: string;
  startTime: string;
  preselectedPackageId?: string; // Package pre-selected in appointment
  onSuccess?: () => void;
}

interface Therapist {
  id: string;
  name: string;
}

interface PackagePurchase {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
  package: {
    id: string;
    name: string;
    category: string | null;
  };
}

export function StartSessionDialog({
  open,
  onOpenChange,
  appointmentId,
  babyId,
  babyName,
  startTime,
  preselectedPackageId,
  onSuccess,
}: StartSessionDialogProps) {
  const t = useTranslations();

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<string>(""); // "" = auto, "trial" = trial session
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTherapists = useCallback(async () => {
    setIsLoadingTherapists(true);
    try {
      const response = await fetch("/api/therapists");
      const data = await response.json();
      if (response.ok) {
        setTherapists(data.therapists || []);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setIsLoadingTherapists(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    if (!babyId) return;
    setIsLoadingPackages(true);
    try {
      const response = await fetch(`/api/babies/${babyId}/packages`);
      const data = await response.json();
      if (response.ok) {
        const availablePackages = data.packages || [];
        setPackages(availablePackages);

        // Auto-select logic:
        // 1. If preselectedPackageId is provided and exists in available packages, use it
        // 2. If no packages, auto-select trial
        // 3. Otherwise, user must choose (including trial option)
        if (preselectedPackageId) {
          const preselected = availablePackages.find(
            (pkg: PackagePurchase) => pkg.id === preselectedPackageId
          );
          if (preselected) {
            setSelectedPackage(preselectedPackageId);
          } else {
            // Preselected package not found (might have been used up), fallback to trial
            setSelectedPackage("trial");
          }
        } else if (availablePackages.length === 0) {
          setSelectedPackage("trial");
        } else {
          setSelectedPackage(""); // User must choose between packages and trial
        }
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, [babyId, preselectedPackageId]);

  useEffect(() => {
    if (open) {
      setSelectedTherapist("");
      setSelectedPackage("");
      setError(null);
      fetchTherapists();
      fetchPackages();
    }
  }, [open, fetchTherapists, fetchPackages]);

  const handleSubmit = async () => {
    if (!selectedTherapist) {
      setError(t("session.errors.SELECT_THERAPIST"));
      return;
    }

    // If packages available and no selection, show error
    if (packages.length >= 1 && !selectedPackage) {
      setError(t("session.errors.SELECT_PACKAGE"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Determine packagePurchaseId
      // If user selected a package (not trial), use that package
      // If trial or no packages, packagePurchaseId stays null
      let packagePurchaseId: string | null = null;
      if (selectedPackage && selectedPackage !== "trial") {
        packagePurchaseId = selectedPackage;
      }

      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          therapistId: selectedTherapist,
          packagePurchaseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`session.errors.${errorKey}`));
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error starting session:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingTherapists || isLoadingPackages;
  // Show package selection when there are packages available (user chooses between packages + trial)
  // When no packages, just show trial info (no selection needed)
  const showPackageSelection = packages.length >= 1 || packages.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Play className="h-5 w-5 text-white" />
            </div>
            {t("session.startSession")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Appointment info */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{babyName}</p>
              <p className="text-sm text-blue-600">{startTime}</p>
            </div>
          </div>

          {/* Therapist selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              {t("session.selectTherapist")}
            </Label>
            {isLoadingTherapists ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <Select
                value={selectedTherapist}
                onValueChange={setSelectedTherapist}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue placeholder={t("session.selectTherapistPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Package selection (only show if multiple packages or no packages) */}
          {!isLoadingPackages && showPackageSelection && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Package className="h-4 w-4" />
                {t("session.selectPackage")}
              </Label>

              {packages.length === 0 ? (
                /* No packages - show trial session info */
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                  <Info className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      {t("session.trialSession")}
                    </p>
                    <p className="text-sm text-amber-700">
                      {t("session.trialSessionDescription")}
                    </p>
                  </div>
                </div>
              ) : (
                /* Multiple packages - show selection */
                <RadioGroup
                  value={selectedPackage}
                  onValueChange={setSelectedPackage}
                  className="space-y-2"
                >
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        selectedPackage === pkg.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-100 hover:border-teal-200 hover:bg-teal-50/50"
                      }`}
                    >
                      <RadioGroupItem value={pkg.id} id={pkg.id} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {pkg.package.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Sparkles className="h-3 w-3 text-teal-500" />
                          <span>
                            {t("session.sessionsRemaining", {
                              remaining: pkg.remainingSessions,
                              total: pkg.totalSessions,
                            })}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}

                  {/* Trial session option */}
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                      selectedPackage === "trial"
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-100 hover:border-amber-200 hover:bg-amber-50/50"
                    }`}
                  >
                    <RadioGroupItem value="trial" id="trial" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {t("session.trialSession")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("session.trialSessionShort")}
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 border-gray-200"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isLoading ||
                !selectedTherapist ||
                (packages.length >= 1 && !selectedPackage)
              }
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 text-white shadow-lg shadow-blue-300/50 transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("session.start")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
