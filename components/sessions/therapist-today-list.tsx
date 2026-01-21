"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, Loader2 } from "lucide-react";
import { TherapistSessionCard } from "./therapist-session-card";
import { EvaluationForm } from "./evaluation-form";
import { ViewEvaluationDialog } from "./view-evaluation-dialog";

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isEvaluated: boolean;
  baby: {
    id: string;
    name: string;
    birthDate: string;
    parents?: Array<{
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
      };
    }>;
  };
  session?: {
    id: string;
    sessionNumber: number;
    evaluation?: {
      id: string;
    } | null;
  } | null;
}

export function TherapistTodayList() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [viewEvaluationDialogOpen, setViewEvaluationDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedBabyName, setSelectedBabyName] = useState<string>("");
  const [selectedBabyAge, setSelectedBabyAge] = useState<number>(0);
  const [selectedParentName, setSelectedParentName] = useState<string>("");

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions?type=today");
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
  }, [t]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
      <div className="rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-teal-200/50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("session.todaySessions")}
            </h1>
            <p className="text-teal-100">
              {new Date().toLocaleDateString(dateLocale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="rounded-full bg-white/20 px-3 py-1">
            {appointments.length} {t("session.sessionsToday")}
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
              onEvaluate={handleEvaluate}
              onViewEvaluation={handleViewEvaluation}
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
    </div>
  );
}
