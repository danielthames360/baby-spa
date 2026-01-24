"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TherapistSessionCard } from "./therapist-session-card";
import { EvaluationForm } from "./evaluation-form";
import { ViewEvaluationDialog } from "./view-evaluation-dialog";
import { ViewBabyDialog } from "./view-baby-dialog";
import { formatLocalDateString } from "@/lib/utils/date-utils";

interface BabyData {
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
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isEvaluated: boolean;
  therapist?: {
    id: string;
    name: string;
  } | null;
  baby: BabyData;
  session?: {
    id: string;
    sessionNumber: number;
    evaluation?: {
      id: string;
    } | null;
  } | null;
  packagePurchase?: {
    id: string;
    package: {
      id: string;
      name: string;
    };
  } | null;
  selectedPackage?: {
    id: string;
    name: string;
  } | null;
}

export function TherapistTodayList() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";
  const { data: session } = useSession();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if selected date is today
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  // Dialog states
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [viewEvaluationDialogOpen, setViewEvaluationDialogOpen] = useState(false);
  const [viewBabyDialogOpen, setViewBabyDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedBabyName, setSelectedBabyName] = useState<string>("");
  const [selectedBabyAge, setSelectedBabyAge] = useState<number>(0);
  const [selectedParentName, setSelectedParentName] = useState<string>("");
  const [selectedBaby, setSelectedBaby] = useState<BabyData | null>(null);

  // Current therapist ID from session
  const currentTherapistId = session?.user?.id;

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = formatLocalDateString(selectedDate);
      const response = await fetch(`/api/sessions?date=${dateStr}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Day navigation
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleEvaluate = (sessionId: string) => {
    const appointment = appointments.find((a) => a.session?.id === sessionId);
    if (appointment) {
      // Calculate baby age in months
      const birthDate = new Date(appointment.baby.birthDate);
      const today = new Date();
      const ageMonths = Math.floor(
        (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );

      // Get primary parent name
      const primaryParent = appointment.baby.parents?.[0]?.parent?.name || "";

      setSelectedSessionId(sessionId);
      setSelectedBabyName(appointment.baby.name);
      setSelectedBabyAge(ageMonths);
      setSelectedParentName(primaryParent);
      setEvaluationDialogOpen(true);
    }
  };

  const handleViewEvaluation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewEvaluationDialogOpen(true);
  };

  const handleViewBaby = (baby: BabyData) => {
    setSelectedBaby(baby);
    setViewBabyDialogOpen(true);
  };

  const handleEvaluationSuccess = () => {
    fetchAppointments();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white shadow-lg shadow-teal-200/50 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Date */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {isToday ? t("session.todaySessions") : t("session.sessionsForDate")}
              </h1>
              <p className="text-sm text-teal-100 sm:text-base">
                {selectedDate.toLocaleDateString(dateLocale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              className="h-9 w-9 rounded-xl border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              onClick={goToToday}
              disabled={isToday}
              className="h-9 rounded-xl border-2 border-white/30 bg-white/10 px-3 text-sm text-white hover:bg-white/20 disabled:opacity-50 sm:h-10 sm:px-4"
            >
              {t("common.today")}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              className="h-9 w-9 rounded-xl border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm sm:gap-4">
          <div className="rounded-full bg-white/20 px-3 py-1">
            {appointments.length} {isToday ? t("session.sessionsToday") : t("session.sessions")}
          </div>
          <div className="rounded-full bg-white/20 px-3 py-1">
            {appointments.filter((a) => !a.isEvaluated && a.status !== "SCHEDULED").length}{" "}
            {t("session.pendingEvaluations")}
          </div>
        </div>
      </div>

      {/* Session list */}
      {appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <TherapistSessionCard
              key={appointment.id}
              appointment={appointment}
              currentTherapistId={currentTherapistId}
              onEvaluate={handleEvaluate}
              onViewEvaluation={handleViewEvaluation}
              onViewBaby={handleViewBaby}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/50 bg-white/50 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
            <Calendar className="h-8 w-8 text-teal-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-600">
            {t("session.noSessionsToday")}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {t("session.noSessionsTodayDescription")}
          </p>
        </div>
      )}

      {/* Evaluation Form Dialog */}
      {selectedSessionId && (
        <EvaluationForm
          open={evaluationDialogOpen}
          onOpenChange={setEvaluationDialogOpen}
          sessionId={selectedSessionId}
          babyName={selectedBabyName}
          babyAgeMonths={selectedBabyAge}
          parentName={selectedParentName}
          onSuccess={handleEvaluationSuccess}
        />
      )}

      {/* View Evaluation Dialog */}
      {selectedSessionId && (
        <ViewEvaluationDialog
          open={viewEvaluationDialogOpen}
          onOpenChange={setViewEvaluationDialogOpen}
          sessionId={selectedSessionId}
        />
      )}

      {/* View Baby Dialog */}
      <ViewBabyDialog
        open={viewBabyDialogOpen}
        onOpenChange={setViewBabyDialogOpen}
        baby={selectedBaby}
      />
    </div>
  );
}
