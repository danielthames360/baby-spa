"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { formatLocalDateString } from "@/lib/utils/date-utils";
import type { PackageData, PackagePurchaseData } from "@/components/packages/package-selector";
import type { SchedulePreference } from "@/lib/types/scheduling";
import confetti from "canvas-confetti";

import { useMobileViewport } from "./use-mobile-viewport";
import {
  BabyStep,
  ClientStep,
  DateTimeStep,
  PackageStep,
  PaymentStep,
  PreferencesStep,
  SuccessStep,
  WizardHeader,
  WizardFooter,
} from "./schedule-wizard";
import type {
  WizardStep,
  ClientType,
  BabyData,
  ParentInfo,
  TimeSlot,
  PaymentSettings,
  BabyCardPortalInfo,
} from "./types";

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babies: BabyData[];
  parentInfo?: ParentInfo | null;
  onSuccess: () => void;
  preselectedBabyId?: string;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  babies,
  parentInfo,
  onSuccess,
  preselectedBabyId,
}: ScheduleDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const { height: viewportHeight, isMobile } = useMobileViewport();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("client");
  const [clientType, setClientType] = useState<ClientType | null>(null);
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

  // Schedule preferences state
  const [wantsFixedSchedule, setWantsFixedSchedule] = useState<boolean | null>(null);
  const [schedulePreferences, setSchedulePreferences] = useState<SchedulePreference[]>([]);
  const [autoScheduling, setAutoScheduling] = useState(false);

  // Payment state
  const [_requiresPayment, setRequiresPayment] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);

  // Animation state
  const [buttonAnimated, setButtonAnimated] = useState(false);

  // Baby Card state
  const [babyCardInfo, setBabyCardInfo] = useState<BabyCardPortalInfo | null>(null);
  const [_loadingBabyCardInfo, setLoadingBabyCardInfo] = useState(false);
  const [unlockedReward, setUnlockedReward] = useState<{
    displayName: string;
    displayIcon: string | null;
  } | null>(null);

  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch package catalog
  const fetchCatalog = useCallback(async (serviceType: "BABY" | "PARENT" = "BABY") => {
    setLoadingCatalog(true);
    try {
      const response = await fetch(`/api/packages?active=true&publicOnly=true&serviceType=${serviceType}`);
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

  // Fetch Baby Card info
  const fetchBabyCardInfo = useCallback(async (babyId: string) => {
    setLoadingBabyCardInfo(true);
    try {
      const response = await fetch(`/api/portal/baby-card/${babyId}`);
      const data = await response.json();
      if (response.ok && data.hasActiveCard) {
        setBabyCardInfo(data);
      } else {
        setBabyCardInfo(null);
      }
    } catch (error) {
      console.error("Error fetching baby card info:", error);
      setBabyCardInfo(null);
    } finally {
      setLoadingBabyCardInfo(false);
    }
  }, []);

  // Trigger confetti celebration
  const triggerConfetti = useCallback(() => {
    const duration = 1000;
    const end = Date.now() + duration;
    const colors = ["#8b5cf6", "#a855f7", "#d946ef", "#f472b6", "#fbbf24"];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Calculate unlocked reward
  const calculateUnlockedReward = useCallback(() => {
    if (!babyCardInfo?.hasActiveCard || !babyCardInfo.purchase) return null;
    if (babyCardInfo.rewardForNextSession) {
      return {
        displayName: babyCardInfo.rewardForNextSession.displayName,
        displayIcon: babyCardInfo.rewardForNextSession.displayIcon,
      };
    }
    return null;
  }, [babyCardInfo]);

  // Initialize wizard when dialog opens
  useEffect(() => {
    if (open) {
      const hasBabies = babies.length > 0;
      const hasParentServices = !!parentInfo?.id;

      if (preselectedBabyId && hasBabies) {
        const baby = babies.find((b) => b.id === preselectedBabyId);
        if (baby) {
          setClientType("baby");
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPurchaseId(baby.packages[0].id);
            setSelectedPackageId(baby.packages[0].package.id);
          }
          setStep("package");
          fetchCatalog("BABY");
          return;
        }
      }

      if (hasBabies && hasParentServices) {
        setStep("client");
      } else if (hasBabies && !hasParentServices) {
        setClientType("baby");
        if (babies.length === 1) {
          const baby = babies[0];
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPurchaseId(baby.packages[0].id);
            setSelectedPackageId(baby.packages[0].package.id);
          }
          setStep("package");
          fetchCatalog("BABY");
        } else {
          setStep("baby");
        }
      } else if (!hasBabies && hasParentServices) {
        setClientType("self");
        if (parentInfo?.packages && parentInfo.packages.length === 1) {
          setSelectedPurchaseId(parentInfo.packages[0].id);
          setSelectedPackageId(parentInfo.packages[0].package.id);
        }
        setStep("package");
        fetchCatalog("PARENT");
      } else {
        setStep("client");
      }
    }
  }, [open, babies, parentInfo, preselectedBabyId, fetchCatalog]);

  // Fetch catalog when package step is reached
  useEffect(() => {
    if (step === "package" && catalogPackages.length === 0 && clientType) {
      fetchCatalog(clientType === "self" ? "PARENT" : "BABY");
    }
  }, [step, fetchCatalog, catalogPackages.length, clientType]);

  // Primitive dependency to prevent re-running when selectedBaby object reference changes
  const selectedBabyId = selectedBaby?.id;

  // Fetch Baby Card info when a baby is selected
  useEffect(() => {
    if (clientType === "baby" && selectedBabyId) {
      fetchBabyCardInfo(selectedBabyId);
    } else {
      setBabyCardInfo(null);
    }
  }, [clientType, selectedBabyId, fetchBabyCardInfo]);

  // Generate available dates
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Find next matching date for a day of week
  const findNextMatchingDate = (dayOfWeek: number): Date => {
    const today = new Date();
    const currentDay = today.getDay();
    let daysToAdd = dayOfWeek - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  // Scroll to top when entering payment step
  useEffect(() => {
    if (step === "payment") {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [step]);

  const fetchSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const dateStr = formatLocalDateString(selectedDate);
      const response = await fetch(`/api/portal/appointments/availability?date=${dateStr}`);
      const data = await response.json();
      if (data.available) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
      }
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchPaymentSettings = async () => {
    setLoadingPaymentSettings(true);
    try {
      const response = await fetch("/api/settings/payment");
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  // Auto-schedule from preferences
  const autoScheduleFromPreferences = async (): Promise<boolean> => {
    const isParentAppointment = clientType === "self";
    if (!isParentAppointment && !selectedBaby) return false;
    if (schedulePreferences.length === 0) return false;
    if (!selectedPurchaseId && !selectedPackageId) return false;

    setAutoScheduling(true);
    setSubmitError(null);

    const firstPref = schedulePreferences[0];
    const targetDate = findNextMatchingDate(firstPref.dayOfWeek);
    const targetTime = firstPref.time;

    try {
      const dateStr = formatLocalDateString(targetDate);
      const availabilityResponse = await fetch(`/api/portal/appointments/availability?date=${dateStr}`);
      const availabilityData = await availabilityResponse.json();

      if (!availabilityData.available) {
        setSubmitError(t("portal.appointments.errors.autoScheduleFailed"));
        setAutoScheduling(false);
        return false;
      }

      const slot = availabilityData.slots?.find((s: TimeSlot) => s.time === targetTime);
      if (!slot || !slot.available) {
        setSubmitError(t("portal.appointments.errors.autoScheduleSlotFull"));
        setAutoScheduling(false);
        return false;
      }

      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isParentAppointment ? { forSelf: true } : { babyId: selectedBaby!.id }),
          packagePurchaseId: selectedPurchaseId,
          packageId: selectedPackageId,
          date: dateStr,
          startTime: targetTime,
          schedulePreferences: schedulePreferences,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "Baby already has an appointment at this time") {
          setSubmitError(t("portal.appointments.errors.babyHasAppointment"));
        } else if (data.error === "Time slot is full") {
          setSubmitError(t("portal.appointments.errors.slotFull"));
        } else {
          setSubmitError(t("portal.appointments.errors.generic"));
        }
        setAutoScheduling(false);
        return false;
      }

      const data = await response.json();
      setSelectedDate(targetDate);
      setSelectedTime(targetTime);

      if (data.requiresAdvancePayment && data.advancePaymentAmount) {
        setRequiresPayment(true);
        setAdvanceAmount(data.advancePaymentAmount);
        await fetchPaymentSettings();
        setStep("payment");
      } else {
        const reward = calculateUnlockedReward();
        setUnlockedReward(reward);
        if (reward) {
          setTimeout(() => triggerConfetti(), 300);
        }
        setStep("success");
      }

      setAutoScheduling(false);
      return true;
    } catch (error) {
      console.error("Error auto-scheduling:", error);
      setSubmitError(t("portal.appointments.errors.generic"));
      setAutoScheduling(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    const isParentAppointment = clientType === "self";
    if (!isParentAppointment && !selectedBaby) return;
    if (!selectedDate || !selectedTime) return;
    if (!selectedPurchaseId && !selectedPackageId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isParentAppointment ? { forSelf: true } : { babyId: selectedBaby!.id }),
          packagePurchaseId: selectedPurchaseId,
          packageId: selectedPackageId,
          date: formatLocalDateString(selectedDate),
          startTime: selectedTime,
          schedulePreferences: wantsFixedSchedule ? schedulePreferences : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "Baby already has an appointment at this time") {
          setSubmitError(t("portal.appointments.errors.babyHasAppointment"));
        } else if (data.error === "Time slot is full") {
          setSubmitError(t("portal.appointments.errors.slotFull"));
        } else {
          setSubmitError(t("portal.appointments.errors.generic"));
        }
        return;
      }

      const data = await response.json();

      if (data.requiresAdvancePayment && data.advancePaymentAmount) {
        setRequiresPayment(true);
        setAdvanceAmount(data.advancePaymentAmount);
        await fetchPaymentSettings();
        setStep("payment");
      } else {
        const reward = calculateUnlockedReward();
        setUnlockedReward(reward);
        if (reward) {
          setTimeout(() => triggerConfetti(), 300);
        }
        setStep("success");
      }
    } catch {
      setSubmitError(t("portal.appointments.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppUrl = () => {
    if (!paymentSettings?.whatsappNumber || !selectedDate) return "";

    const countryCode = (paymentSettings.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettings.whatsappNumber.replace(/\D/g, "");

    let message = paymentSettings.whatsappMessage || "";
    message = message
      .replace(
        "{fecha}",
        selectedDate.toLocaleDateString(dateLocale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      )
      .replace("{hora}", selectedTime)
      .replace("{bebe}", selectedBaby?.name || parentInfo?.name || "")
      .replace("{monto}", advanceAmount?.toString() || "");

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleDownloadQr = async () => {
    if (!paymentSettings?.paymentQrImage) return;

    try {
      const response = await fetch(paymentSettings.paymentQrImage);
      const blob = await response.blob();
      const file = new File([blob], "QR-Pago-BabySpa.png", { type: "image/png" });

      const isMobileDevice = window.innerWidth < 640 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobileDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Pago Baby Spa",
        });
        return;
      }
    } catch (error) {
      // Share API not available or user cancelled, fall through to download
    }

    const link = document.createElement("a");
    link.href = paymentSettings.paymentQrImage;
    link.download = "QR-Pago-BabySpa.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAndClose = (fromSuccess = false) => {
    if (fromSuccess || step === "success" || step === "payment") {
      onSuccess();
    }
    setStep("client");
    setClientType(null);
    setSelectedBaby(null);
    setSelectedPackageId(null);
    setSelectedPurchaseId(null);
    setCatalogPackages([]);
    setSelectedDate(null);
    setSelectedTime("");
    setButtonAnimated(false);
    setWantsFixedSchedule(null);
    setSchedulePreferences([]);
    setAutoScheduling(false);
    setRequiresPayment(false);
    setAdvanceAmount(null);
    setPaymentSettings(null);
    setBabyCardInfo(null);
    setUnlockedReward(null);
    onOpenChange(false);
  };

  const handlePackageSelect = (packageId: string | null, purchaseId: string | null) => {
    setSelectedPackageId(packageId);
    setSelectedPurchaseId(purchaseId);
    if (packageId || purchaseId) {
      setButtonAnimated(true);
      setTimeout(() => setButtonAnimated(false), 2000);
    }
  };

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

  const getParentPackagesForSelector = (): PackagePurchaseData[] => {
    if (!parentInfo?.packages) return [];
    return parentInfo.packages.map((pkg) => ({
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

  const getPackagesForSelector = (): PackagePurchaseData[] => {
    if (clientType === "self") {
      return getParentPackagesForSelector();
    }
    return getBabyPackagesForSelector();
  };

  const getSelectedPackageName = () => {
    if (selectedPurchaseId && selectedBaby) {
      const pkg = selectedBaby.packages.find((p) => p.id === selectedPurchaseId);
      return pkg?.package.name || "";
    }
    if (selectedPurchaseId && clientType === "self" && parentInfo?.packages) {
      const pkg = parentInfo.packages.find((p) => p.id === selectedPurchaseId);
      return pkg?.package.name || "";
    }
    if (selectedPackageId) {
      const pkg = catalogPackages.find((p) => p.id === selectedPackageId);
      return pkg?.name || "";
    }
    return "";
  };

  const hasMultipleSessions = (): boolean => {
    if (selectedPurchaseId && selectedBaby) {
      const pkg = selectedBaby.packages.find((p) => p.id === selectedPurchaseId);
      return (pkg?.remainingSessions || 0) > 1;
    }
    if (selectedPurchaseId && clientType === "self" && parentInfo?.packages) {
      const pkg = parentInfo.packages.find((p) => p.id === selectedPurchaseId);
      return (pkg?.remainingSessions || 0) > 1;
    }
    if (selectedPackageId) {
      const pkg = catalogPackages.find((p) => p.id === selectedPackageId);
      return (pkg?.sessionCount || 0) > 1;
    }
    return false;
  };

  const shouldShowPreferencesStep = hasMultipleSessions();

  // Navigation handlers
  const handleBack = () => {
    const hasBothOptions = babies.length > 0 && !!parentInfo?.id;

    if (step === "baby") {
      if (hasBothOptions) {
        setStep("client");
        setClientType(null);
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
        setCatalogPackages([]);
      }
    } else if (step === "package") {
      if (clientType === "self") {
        if (hasBothOptions) {
          setStep("client");
          setClientType(null);
          setSelectedPackageId(null);
          setSelectedPurchaseId(null);
          setCatalogPackages([]);
        }
      } else if (babies.length > 1 && !preselectedBabyId) {
        setStep("baby");
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
      } else if (hasBothOptions) {
        setStep("client");
        setClientType(null);
        setSelectedBaby(null);
        setSelectedPackageId(null);
        setSelectedPurchaseId(null);
        setCatalogPackages([]);
      }
    } else if (step === "preferences") {
      setStep("package");
    } else if (step === "datetime") {
      if (shouldShowPreferencesStep) {
        setStep("preferences");
      } else {
        setStep("package");
      }
    }
  };

  const handleNext = async () => {
    if (step === "package" && (selectedPackageId || selectedPurchaseId)) {
      if (shouldShowPreferencesStep) {
        setStep("preferences");
      } else {
        setStep("datetime");
      }
    } else if (step === "preferences") {
      if (wantsFixedSchedule === true && schedulePreferences.length > 0) {
        const success = await autoScheduleFromPreferences();
        if (!success) {
          setStep("datetime");
        }
      } else {
        setStep("datetime");
      }
    }
  };

  const canGoBack = () => {
    const hasBothOptions = babies.length > 0 && !!parentInfo?.id;
    if (step === "baby") return hasBothOptions;
    if (step === "package") {
      if (clientType === "self") return hasBothOptions;
      return babies.length > 1 || hasBothOptions;
    }
    if (step === "preferences") return true;
    if (step === "datetime") return true;
    return false;
  };

  const getStepNumber = () => {
    if (step === "package") return 1;
    if (step === "preferences") return 2;
    if (step === "datetime") return shouldShowPreferencesStep ? 3 : 2;
    return 1;
  };

  const getTotalSteps = () => (shouldShowPreferencesStep ? 3 : 2);

  const canProceed = () => {
    if (step === "package") return !!(selectedPackageId || selectedPurchaseId);
    if (step === "preferences") {
      return wantsFixedSchedule === false || (wantsFixedSchedule === true && schedulePreferences.length > 0);
    }
    if (step === "datetime") return !!(selectedDate && selectedTime);
    return false;
  };

  // Client selection handlers
  const handleSelectBaby = () => {
    setClientType("baby");
    if (babies.length === 1) {
      const baby = babies[0];
      setSelectedBaby(baby);
      if (baby.packages.length === 1) {
        setSelectedPurchaseId(baby.packages[0].id);
        setSelectedPackageId(baby.packages[0].package.id);
      }
      setStep("package");
      fetchCatalog("BABY");
    } else {
      setStep("baby");
    }
  };

  const handleSelectSelf = () => {
    setClientType("self");
    if (parentInfo?.packages && parentInfo.packages.length === 1) {
      setSelectedPurchaseId(parentInfo.packages[0].id);
      setSelectedPackageId(parentInfo.packages[0].package.id);
    }
    setStep("package");
    fetchCatalog("PARENT");
  };

  const handleBabySelect = (baby: BabyData) => {
    setSelectedBaby(baby);
    if (baby.packages.length === 1) {
      setSelectedPurchaseId(baby.packages[0].id);
      setSelectedPackageId(baby.packages[0].package.id);
    } else {
      setSelectedPurchaseId(null);
      setSelectedPackageId(null);
    }
    setStep("package");
    fetchCatalog("BABY");
  };

  const getClientName = () => {
    if (clientType === "self") return parentInfo?.name || "";
    return selectedBaby?.name || "";
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border"
        style={viewportHeight && isMobile ? { height: viewportHeight, maxHeight: viewportHeight } : undefined}
      >
        {/* Accessibility */}
        <VisuallyHidden>
          <DialogTitle>{t("portal.appointments.wizard.title")}</DialogTitle>
          <DialogDescription>{t("portal.appointments.wizard.description")}</DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <WizardHeader
          step={step}
          clientType={clientType}
          selectedBaby={selectedBaby}
          parentInfo={parentInfo || null}
          canGoBack={canGoBack()}
          onBack={handleBack}
          getStepNumber={getStepNumber}
          getTotalSteps={getTotalSteps}
        />

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {step === "client" && (
            <ClientStep
              babies={babies}
              parentInfo={parentInfo || null}
              onSelectBaby={handleSelectBaby}
              onSelectSelf={handleSelectSelf}
            />
          )}

          {step === "baby" && (
            <BabyStep babies={babies} onSelectBaby={handleBabySelect} />
          )}

          {step === "package" && (selectedBaby || clientType === "self") && (
            <PackageStep
              catalogPackages={catalogPackages}
              babyPackages={getPackagesForSelector()}
              specialPrices={babyCardInfo?.specialPrices}
              selectedPackageId={selectedPackageId}
              selectedPurchaseId={selectedPurchaseId}
              loadingCatalog={loadingCatalog}
              babyId={clientType === "self" ? undefined : selectedBaby?.id}
              onSelectPackage={handlePackageSelect}
            />
          )}

          {step === "preferences" && (selectedBaby || clientType === "self") && (
            <PreferencesStep
              selectedPackageName={getSelectedPackageName()}
              wantsFixedSchedule={wantsFixedSchedule}
              schedulePreferences={schedulePreferences}
              onWantsFixedScheduleChange={setWantsFixedSchedule}
              onSchedulePreferencesChange={setSchedulePreferences}
              findNextMatchingDate={findNextMatchingDate}
            />
          )}

          {step === "datetime" && (selectedBaby || clientType === "self") && (
            <DateTimeStep
              selectedPackageName={getSelectedPackageName()}
              availableDates={availableDates}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              availableSlots={availableSlots}
              loadingSlots={loadingSlots}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
              }}
              onSelectTime={setSelectedTime}
              onClearError={() => setSubmitError(null)}
            />
          )}

          {step === "payment" && (
            <PaymentStep
              advanceAmount={advanceAmount}
              selectedPackageName={getSelectedPackageName()}
              paymentSettings={paymentSettings}
              loadingPaymentSettings={loadingPaymentSettings}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              clientType={clientType}
              clientName={getClientName()}
              onDownloadQr={handleDownloadQr}
              getWhatsAppUrl={getWhatsAppUrl}
            />
          )}

          {step === "success" && (
            <SuccessStep
              clientType={clientType}
              clientName={getClientName()}
              selectedPackageName={getSelectedPackageName()}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              unlockedReward={unlockedReward}
              babyCardInfo={babyCardInfo}
              onClose={() => resetAndClose(true)}
            />
          )}
        </div>

        {/* Footer */}
        <WizardFooter
          step={step}
          canProceed={canProceed()}
          submitting={submitting}
          autoScheduling={autoScheduling}
          submitError={submitError}
          buttonAnimated={buttonAnimated}
          selectedPackageId={selectedPackageId}
          selectedPurchaseId={selectedPurchaseId}
          wantsFixedSchedule={wantsFixedSchedule}
          schedulePreferencesCount={schedulePreferences.length}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onClose={() => resetAndClose(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
