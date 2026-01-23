"use client";

import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { useTranslations } from "next-intl";

// Hook for mobile fullscreen modal (iOS Safari compatible)
function useMobileViewport() {
  const [styles, setStyles] = useState<{ height?: number; isMobile: boolean }>({ isMobile: false });

  useLayoutEffect(() => {
    function update() {
      const isMobile = window.innerWidth < 640;
      // Use visualViewport for most accurate height (handles iOS Safari toolbar)
      const height = window.visualViewport?.height ?? window.innerHeight;
      setStyles({ height, isMobile });
    }

    update();

    // visualViewport is the most reliable for iOS Safari
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    }
    window.addEventListener('orientationchange', update);

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', update);
        viewport.removeEventListener('scroll', update);
      }
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return styles;
}
import {
  Calendar,
  Clock,
  Baby,
  Plus,
  AlertTriangle,
  AlertCircle,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import {
  PackageSelector,
  type PackageData,
  type PackagePurchaseData,
} from "@/components/packages/package-selector";

export interface BabyPackage {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
  package: {
    id: string;
    name: string;
    categoryId: string | null;
    duration: number;
  };
}

export interface ScheduleBabyData {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  totalRemainingSessions: number;
  packages: BabyPackage[];
}

// Alias for internal use
type BabyData = ScheduleBabyData;

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  baby: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  };
  therapist: {
    name: string;
  } | null;
  packagePurchase: {
    id: string;
    package: {
      name: string;
    };
  } | null;
  selectedPackage: {
    id: string;
    name: string;
  } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  remaining: number;
}

export function PortalAppointments() {
  const t = useTranslations();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [babies, setBabies] = useState<BabyData[]>([]);
  const [canSchedule, setCanSchedule] = useState(true);
  const [requiresPrepayment, setRequiresPrepayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/portal/appointments");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setUpcoming(data.upcoming);
      setPast(data.past);
      setBabies(data.babies);
      setCanSchedule(data.canSchedule);
      setRequiresPrepayment(data.requiresPrepayment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SCHEDULED: "bg-amber-100 text-amber-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-gray-100 text-gray-700",
      NO_SHOW: "bg-rose-100 text-rose-700",
    };
    return (
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", styles[status])}>
        {t(`portal.appointments.status.${status}`)}
      </span>
    );
  };

  // All active babies can schedule (package is selected during booking flow)
  const canScheduleBabies = babies;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("portal.appointments.title")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("portal.appointments.subtitle")}
            </p>
          </div>
        </div>

        {canSchedule && canScheduleBabies.length > 0 && (
          <Button
            onClick={() => setShowScheduleDialog(true)}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 hover:from-teal-600 hover:to-cyan-600"
          >
            <Plus className="h-4 w-4" />
            {t("portal.appointments.scheduleNew")}
          </Button>
        )}
      </div>

      {/* Prepayment Warning */}
      {requiresPrepayment && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {t("portal.appointments.cannotSchedule")}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {t("portal.appointments.contactReception")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
              asChild
            >
              <a href="https://wa.me/59170000000" target="_blank" rel="noopener noreferrer">
                <Phone className="mr-2 h-4 w-4" />
                {t("portal.prepayment.contact")}
              </a>
            </Button>
          </div>
        </div>
      )}


      {/* Upcoming Appointments */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700">
          <Clock className="h-5 w-5 text-teal-500" />
          {t("portal.appointments.upcoming")}
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">{t("portal.appointments.noUpcoming")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} formatDate={formatDate} getStatusBadge={getStatusBadge} />
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700">
            <CheckCircle className="h-5 w-5 text-gray-400" />
            {t("portal.appointments.past")}
          </h2>
          <div className="space-y-3">
            {past.slice(0, 10).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} formatDate={formatDate} getStatusBadge={getStatusBadge} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        babies={canScheduleBabies}
        onSuccess={() => {
          setShowScheduleDialog(false);
          fetchData();
        }}
      />
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  isPast?: boolean;
}

function AppointmentCard({ appointment, formatDate, getStatusBadge, isPast }: AppointmentCardProps) {
  const t = useTranslations();
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "MALE": return "from-sky-400 to-blue-500";
      case "FEMALE": return "from-rose-400 to-pink-500";
      default: return "from-teal-400 to-cyan-500";
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 rounded-xl border p-4 transition-all",
      isPast
        ? "border-gray-100 bg-gray-50/50"
        : "border-teal-100 bg-gradient-to-r from-white to-teal-50/30 hover:shadow-md"
    )}>
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md",
          isPast ? "bg-gray-300" : `bg-gradient-to-br ${getGenderColor(appointment.baby.gender)}`
        )}
      >
        {appointment.baby.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-800">{appointment.baby.name}</h3>
          {getStatusBadge(appointment.status)}
          {/* Package badge */}
          {appointment.packagePurchase ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
              <Package className="h-3 w-3" />
              {appointment.packagePurchase.package.name}
            </span>
          ) : appointment.selectedPackage ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Package className="h-3 w-3" />
              {appointment.selectedPackage.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
              <Package className="h-3 w-3" />
              {t("portal.appointments.provisional")}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(appointment.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {appointment.startTime}
          </span>
        </div>
      </div>
    </div>
  );
}

// Wizard step type
type WizardStep = 'baby' | 'package' | 'datetime' | 'success';

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babies: ScheduleBabyData[];
  onSuccess: () => void;
  preselectedBabyId?: string; // Optional: pre-select a baby (e.g., from dashboard)
}

export function ScheduleDialog({ open, onOpenChange, babies, onSuccess, preselectedBabyId }: ScheduleDialogProps) {
  const t = useTranslations();

  // Mobile viewport handling (iOS Safari compatible)
  const { height: viewportHeight, isMobile } = useMobileViewport();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('baby');
  const [selectedBaby, setSelectedBaby] = useState<BabyData | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [catalogPackages, setCatalogPackages] = useState<PackageData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Animation trigger for button
  const [buttonAnimated, setButtonAnimated] = useState(false);

  // Ref for scrollable container (auto-scroll on mobile)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch package catalog for PackageSelector
  const fetchCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const response = await fetch("/api/packages?active=true");
      const data = await response.json();
      if (response.ok) {
        setCatalogPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching package catalog:", error);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  // Initialize wizard when dialog opens
  useEffect(() => {
    if (open && babies.length > 0) {
      // If preselectedBabyId is provided, use that
      if (preselectedBabyId) {
        const baby = babies.find(b => b.id === preselectedBabyId);
        if (baby) {
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPurchaseId(baby.packages[0].id);
            setSelectedPackageId(baby.packages[0].package.id);
          }
          setStep('package');
          fetchCatalog();
          return;
        }
      }
      // If only 1 baby, auto-select and skip baby step
      if (babies.length === 1) {
        const baby = babies[0];
        setSelectedBaby(baby);
        if (baby.packages.length === 1) {
          setSelectedPurchaseId(baby.packages[0].id);
          setSelectedPackageId(baby.packages[0].package.id);
        }
        setStep('package');
        fetchCatalog();
      } else {
        // Multiple babies - start at baby selection
        setStep('baby');
      }
    }
  }, [open, babies, preselectedBabyId, fetchCatalog]);

  // Fetch catalog when package step is reached
  useEffect(() => {
    if (step === 'package' && catalogPackages.length === 0) {
      fetchCatalog();
    }
  }, [step, fetchCatalog, catalogPackages.length]);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(`/api/portal/appointments/availability?date=${dateStr}`);
      const data = await response.json();
      if (data.available) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
      }
      // Auto-scroll to show time slots on mobile
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    // Must have baby, date, time, and package selected
    if (!selectedBaby || !selectedDate || !selectedTime) return;
    if (!selectedPurchaseId && !selectedPackageId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId: selectedBaby.id,
          packagePurchaseId: selectedPurchaseId, // null if new package from catalog
          packageId: selectedPackageId, // For displaying package info (provisional)
          date: selectedDate.toISOString().split("T")[0],
          startTime: selectedTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Map API errors to user-friendly messages
        if (data.error === "Baby already has an appointment at this time") {
          setSubmitError(t("portal.appointments.errors.babyHasAppointment"));
        } else if (data.error === "Time slot is full") {
          setSubmitError(t("portal.appointments.errors.slotFull"));
        } else {
          setSubmitError(t("portal.appointments.errors.generic"));
        }
        return;
      }

      setStep('success');
      // Don't call onSuccess here - will be called when user closes success screen
    } catch {
      setSubmitError(t("portal.appointments.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = (fromSuccess = false) => {
    // If closing from success screen, trigger data refresh
    if (fromSuccess || step === 'success') {
      onSuccess();
    }
    setStep('baby');
    setSelectedBaby(null);
    setSelectedPackageId(null);
    setSelectedPurchaseId(null);
    setSelectedDate(null);
    setSelectedTime("");
    setButtonAnimated(false);
    onOpenChange(false);
  };

  // Handle package selection from PackageSelector
  const handlePackageSelect = (packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
    // Trigger button animation
    if (packageId || purchaseId) {
      setButtonAnimated(true);
      setTimeout(() => setButtonAnimated(false), 2000);
    }
  };

  // Transform baby packages to PackageSelector format
  const getBabyPackagesForSelector = (): PackagePurchaseData[] => {
    if (!selectedBaby) return [];
    return selectedBaby.packages.map((pkg) => ({
      id: pkg.id,
      remainingSessions: pkg.remainingSessions,
      totalSessions: pkg.totalSessions,
      usedSessions: pkg.usedSessions,
      package: {
        id: pkg.package.id,
        name: pkg.package.name,
        categoryId: pkg.package.categoryId,
        duration: pkg.package.duration,
      },
    }));
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Navigation handlers
  const handleBack = () => {
    if (step === 'package' && babies.length > 1 && !preselectedBabyId) {
      setStep('baby');
    } else if (step === 'datetime') {
      setStep('package');
    }
  };

  const handleNext = () => {
    if (step === 'package' && (selectedPackageId || selectedPurchaseId)) {
      setStep('datetime');
    }
  };

  // Calculate step numbers for display
  const getStepNumber = () => {
    if (step === 'package') return 1;
    if (step === 'datetime') return 2;
    return 1;
  };

  const getTotalSteps = () => 2;

  const canProceed = () => {
    if (step === 'package') return !!(selectedPackageId || selectedPurchaseId);
    if (step === 'datetime') return !!(selectedDate && selectedTime);
    return false;
  };

  // Get selected package name for summary
  const getSelectedPackageName = () => {
    if (selectedPurchaseId && selectedBaby) {
      const pkg = selectedBaby.packages.find(p => p.id === selectedPurchaseId);
      return pkg?.package.name || '';
    }
    if (selectedPackageId) {
      const pkg = catalogPackages.find(p => p.id === selectedPackageId);
      return pkg?.name || '';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border"
        style={viewportHeight && isMobile ? { height: viewportHeight, maxHeight: viewportHeight } : undefined}
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden>
          <DialogTitle>{t("portal.appointments.wizard.title")}</DialogTitle>
          <DialogDescription>{t("portal.appointments.wizard.description")}</DialogDescription>
        </VisuallyHidden>

        {/* Header - Fixed */}
        {step !== 'success' && (
          <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back button */}
                {((step === 'package' && babies.length > 1 && !preselectedBabyId) || step === 'datetime') && (
                  <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {step === 'baby' && t("portal.appointments.selectBaby")}
                    {step === 'package' && t("packages.selectPackage")}
                    {step === 'datetime' && t("portal.appointments.wizard.selectDateTime")}
                  </h2>
                  {step !== 'baby' && (
                    <p className="text-xs text-gray-500">
                      {t("portal.appointments.wizard.step")} {getStepNumber()} {t("portal.appointments.wizard.of")} {getTotalSteps()}
                    </p>
                  )}
                </div>
              </div>
              {/* Baby indicator */}
              {selectedBaby && step !== 'baby' && (
                <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1">
                  <Baby className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">{selectedBaby.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* Baby Selection Step */}
          {step === 'baby' && (
            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600">
                {t("portal.appointments.wizard.selectBabyDescription")}
              </p>
              <div className="space-y-3">
                {babies.map((baby) => {
                  const genderColor = baby.gender === "MALE"
                    ? "from-sky-400 to-blue-500"
                    : baby.gender === "FEMALE"
                    ? "from-rose-400 to-pink-500"
                    : "from-teal-400 to-cyan-500";

                  return (
                    <button
                      key={baby.id}
                      onClick={() => {
                        setSelectedBaby(baby);
                        if (baby.packages.length === 1) {
                          setSelectedPurchaseId(baby.packages[0].id);
                          setSelectedPackageId(baby.packages[0].package.id);
                        } else {
                          setSelectedPurchaseId(null);
                          setSelectedPackageId(null);
                        }
                        setStep('package');
                        fetchCatalog();
                      }}
                      className="flex w-full items-center gap-4 rounded-2xl border-2 border-teal-100 bg-white p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-md"
                    >
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold text-white shadow-md",
                        genderColor
                      )}>
                        {baby.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-gray-800">{baby.name}</p>
                        <p className="text-sm text-gray-500">
                          {baby.totalRemainingSessions > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              {baby.totalRemainingSessions} {t("portal.dashboard.sessionsAvailable")}
                            </span>
                          ) : (
                            <span className="text-amber-600">
                              {t("portal.appointments.wizard.noSessions")}
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-6 w-6 shrink-0 text-teal-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Package Selection Step */}
          {step === 'package' && selectedBaby && (
            <div className="p-4">
              {loadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                </div>
              ) : (
                <PackageSelector
                  babyId={selectedBaby.id}
                  packages={catalogPackages}
                  babyPackages={getBabyPackagesForSelector()}
                  selectedPackageId={selectedPackageId}
                  selectedPurchaseId={selectedPurchaseId}
                  onSelectPackage={handlePackageSelect}
                  showCategories={true}
                  showPrices={false}
                  showExistingFirst={true}
                  allowNewPackage={true}
                  compact={true}
                  showProvisionalMessage={false}
                  maxHeight="none"
                />
              )}
            </div>
          )}

          {/* Date & Time Selection Step */}
          {step === 'datetime' && selectedBaby && (
            <div className="p-4 space-y-6">
              {/* Selected package summary */}
              <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3 border border-teal-100">
                <Package className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">
                  {getSelectedPackageName()}
                </span>
                <span className="ml-auto text-xs text-teal-500">
                  {t("portal.appointments.provisional")}
                </span>
              </div>

              {/* Date selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  {t("portal.appointments.selectDate")}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableDates.map((date) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime("");
                        }}
                        className={cn(
                          "flex flex-col items-center rounded-xl border-2 p-3 transition-all",
                          isSelected
                            ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm"
                            : "border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-medium uppercase",
                          isSelected ? "text-teal-600" : "text-gray-400"
                        )}>
                          {date.toLocaleDateString("es-ES", { weekday: "short" })}
                        </span>
                        <span className={cn(
                          "text-lg font-bold",
                          isSelected ? "text-teal-700" : "text-gray-800"
                        )}>
                          {date.getDate()}
                        </span>
                        <span className={cn(
                          "text-[10px]",
                          isSelected ? "text-teal-500" : "text-gray-400"
                        )}>
                          {date.toLocaleDateString("es-ES", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selection */}
              {selectedDate && (
                <div className="animate-fadeIn">
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    {t("portal.appointments.selectTime")}
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 p-6 text-center">
                      <Clock className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">{t("babyProfile.appointments.noSlots")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => {
                              if (slot.available) {
                                setSelectedTime(slot.time);
                                setSubmitError(null);
                              }
                            }}
                            disabled={!slot.available}
                            className={cn(
                              "rounded-xl border-2 py-3 text-sm font-medium transition-all",
                              !slot.available && "cursor-not-allowed border-gray-50 bg-gray-50 text-gray-300",
                              slot.available && isSelected
                                ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                                : slot.available && "border-gray-100 bg-white text-gray-700 hover:border-teal-200 hover:bg-teal-50/30"
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
              {/* Close button */}
              <button
                onClick={() => resetAndClose(true)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-100">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-800">
                {t("portal.appointments.appointmentConfirmed")}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {t("portal.appointments.wizard.successMessage")}
              </p>

              {/* Summary */}
              <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.baby")}:</span>
                  <span className="font-medium text-gray-800">{selectedBaby?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.package")}:</span>
                  <span className="font-medium text-gray-800">{getSelectedPackageName()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.date")}:</span>
                  <span className="font-medium text-gray-800">
                    {selectedDate?.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("common.time")}:</span>
                  <span className="font-medium text-gray-800">{selectedTime}</span>
                </div>
              </div>

              {/* Close button at bottom */}
              <Button
                onClick={() => resetAndClose(true)}
                className="mt-6 h-12 w-full max-w-xs gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200"
              >
                {t("common.close")}
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {step !== 'success' && step !== 'baby' && (
          <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:rounded-b-2xl">
            {/* Error message */}
            {submitError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            {/* Provisional message */}
            {step === 'package' && (selectedPackageId || selectedPurchaseId) && !submitError && (
              <p className="mb-3 text-center text-xs text-gray-500">
                {t("packages.provisional")}
              </p>
            )}

            <Button
              onClick={step === 'datetime' ? handleSubmit : handleNext}
              disabled={!canProceed() || submitting}
              className={cn(
                "h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:shadow-none",
                canProceed() && buttonAnimated && "animate-pulse-subtle"
              )}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : step === 'datetime' ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
