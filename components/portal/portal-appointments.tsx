"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Baby,
  Plus,
  AlertTriangle,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface BabyPackage {
  id: string;
  name: string;
  remainingSessions: number;
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

  // All active babies can schedule (even without packages - "session to define")
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
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Package className="h-3 w-3" />
              {t("portal.appointments.sessionToDefine")}
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

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babies: ScheduleBabyData[];
  onSuccess: () => void;
  preselectedBabyId?: string; // Optional: pre-select a baby (e.g., from dashboard)
}

export function ScheduleDialog({ open, onOpenChange, babies, onSuccess, preselectedBabyId }: ScheduleDialogProps) {
  const t = useTranslations();
  const [step, setStep] = useState(1);
  const [selectedBaby, setSelectedBaby] = useState<BabyData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-select baby when dialog opens (if only 1 baby OR preselected)
  useEffect(() => {
    if (open && babies.length > 0 && !selectedBaby) {
      // If preselectedBabyId is provided, use that
      if (preselectedBabyId) {
        const baby = babies.find(b => b.id === preselectedBabyId);
        if (baby) {
          setSelectedBaby(baby);
          if (baby.packages.length === 1) {
            setSelectedPackage(baby.packages[0].id);
          }
          setStep(2);
          return;
        }
      }
      // If only 1 baby, auto-select and skip to step 2
      if (babies.length === 1) {
        const baby = babies[0];
        setSelectedBaby(baby);
        if (baby.packages.length === 1) {
          setSelectedPackage(baby.packages[0].id);
        }
        setStep(2);
      }
    }
  }, [open, babies, preselectedBabyId, selectedBaby]);

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
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    // Package is optional - empty string means "session to define"
    if (!selectedBaby || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId: selectedBaby.id,
          packagePurchaseId: selectedPackage || null, // null = session to define
          date: selectedDate.toISOString().split("T")[0],
          startTime: selectedTime,
        }),
      });

      if (!response.ok) throw new Error("Failed");

      setSuccess(true);
      setTimeout(() => {
        resetAndClose();
        onSuccess();
      }, 1500);
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedBaby(null);
    setSelectedPackage("");
    setSelectedDate(null);
    setSelectedTime("");
    setSuccess(false);
    onOpenChange(false);
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            {t("portal.appointments.scheduleNew")}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              {t("portal.appointments.appointmentConfirmed")}
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Select Baby */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t("portal.appointments.selectBaby")}</p>
                <div className="grid gap-3">
                  {babies.map((baby) => (
                    <button
                      key={baby.id}
                      onClick={() => {
                        setSelectedBaby(baby);
                        if (baby.packages.length === 1) {
                          setSelectedPackage(baby.packages[0].id);
                        }
                        setStep(2);
                      }}
                      className="flex items-center gap-3 rounded-xl border-2 border-teal-100 p-4 text-left transition-all hover:border-teal-300 hover:bg-teal-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-lg font-bold text-white">
                        {baby.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{baby.name}</p>
                        <p className="text-sm text-gray-500">
                          {baby.totalRemainingSessions} {t("portal.dashboard.sessionsAvailable")}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Package (if multiple) and Date */}
            {step === 2 && selectedBaby && (
              <div className="space-y-4">
                {/* Only show back button if multiple babies and no preselected baby */}
                {babies.length > 1 && !preselectedBabyId && (
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common.back")}
                  </button>
                )}

                <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-3">
                  <Baby className="h-5 w-5 text-teal-600" />
                  <span className="font-medium text-teal-700">{selectedBaby.name}</span>
                </div>

                {/* Package selection or "session to define" */}
                {selectedBaby.packages.length === 0 ? (
                  // No packages - show "session to define" message
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800">
                          {t("portal.appointments.sessionToDefine")}
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          {t("portal.appointments.sessionToDefineDescription")}
                        </p>
                        <a
                          href="https://wa.me/59170000000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          <Phone className="h-4 w-4" />
                          {t("portal.appointments.contactForPackage")}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : selectedBaby.packages.length === 1 ? (
                  // Single package - show which one is selected
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        {selectedBaby.packages[0].name} ({selectedBaby.packages[0].remainingSessions} {t("portal.baby.sessionsLeft")})
                      </span>
                    </div>
                  </div>
                ) : (
                  // Multiple packages - show selector
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t("portal.baby.packages")}
                    </label>
                    <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                      <SelectTrigger className="rounded-xl border-2 border-teal-100">
                        <SelectValue placeholder={t("common.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedBaby.packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} ({pkg.remainingSessions} {t("portal.baby.sessionsLeft")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("portal.appointments.selectDate")}
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {availableDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime("");
                        }}
                        className={cn(
                          "rounded-lg border-2 p-2 text-center text-sm transition-all",
                          selectedDate?.toDateString() === date.toDateString()
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 hover:border-teal-200 hover:bg-teal-50/50"
                        )}
                      >
                        {formatDateShort(date)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time selection */}
                {selectedDate && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t("portal.appointments.selectTime")}
                    </label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500">{t("babyProfile.appointments.noSlots")}</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={cn(
                              "rounded-lg border-2 p-2 text-sm transition-all",
                              !slot.available && "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
                              slot.available && selectedTime === slot.time
                                ? "border-teal-500 bg-teal-50 text-teal-700"
                                : slot.available && "border-gray-200 hover:border-teal-200"
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm button */}
                {selectedTime && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {t("portal.appointments.confirmAppointment")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
