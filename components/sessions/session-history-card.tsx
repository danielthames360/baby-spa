"use client";

import { useTranslations } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import {
  Calendar,
  Clock,
  User,
  Droplets,
  Heart,
  Activity,
  Sparkles,
  Moon,
  Eye,
  Ear,
  Users,
  SmilePlus,
  Frown,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SessionHistoryCardProps {
  session: {
    id: string;
    sessionNumber: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    evaluatedAt: string | null;
    appointment: {
      date: string;
      startTime: string;
      endTime: string;
    };
    therapist: {
      id: string;
      name: string;
    };
    evaluation: {
      id: string;
      babyAgeMonths: number;
      // Activities
      hydrotherapy: boolean;
      massage: boolean;
      motorStimulation: boolean;
      sensoryStimulation: boolean;
      relaxation: boolean;
      otherActivities: string | null;
      // Sensory
      visualTracking: boolean | null;
      eyeContact: boolean | null;
      auditoryResponse: boolean | null;
      // Muscle
      muscleTone: "LOW" | "NORMAL" | "TENSE" | null;
      cervicalControl: boolean | null;
      headUp: boolean | null;
      // Milestones
      sits: boolean | null;
      crawls: boolean | null;
      walks: boolean | null;
      // State
      mood: "CALM" | "IRRITABLE" | null;
      // Notes
      internalNotes: string | null;
      externalNotes: string | null;
    } | null;
    packagePurchase: {
      package: {
        name: string;
      };
    } | null;
  };
  locale: string;
}

export function SessionHistoryCard({ session, locale }: SessionHistoryCardProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const formatDate = (dateStr: string) => {
    return formatDateForDisplay(dateStr, dateLocale, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activities = session.evaluation
    ? [
        { key: "hydrotherapy", value: session.evaluation.hydrotherapy, icon: Droplets, emoji: "💧" },
        { key: "massage", value: session.evaluation.massage, icon: Heart, emoji: "💆" },
        { key: "motorStimulation", value: session.evaluation.motorStimulation, icon: Activity, emoji: "🏃" },
        { key: "sensoryStimulation", value: session.evaluation.sensoryStimulation, icon: Sparkles, emoji: "✨" },
        { key: "relaxation", value: session.evaluation.relaxation, icon: Moon, emoji: "😴" },
      ].filter((a) => a.value)
    : [];

  const BooleanIndicator = ({ value }: { value: boolean | null }) => {
    if (value === null || value === undefined) {
      return <Minus className="h-4 w-4 text-gray-300" />;
    }
    return value ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    ) : (
      <XCircle className="h-4 w-4 text-rose-400" />
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md transition-all duration-300 hover:shadow-xl">
      {/* Header - Always visible */}
      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Session number badge */}
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200">
          <span className="text-[10px] font-medium uppercase opacity-80">
            {t("session.sessionLabel")}
          </span>
          <span className="text-xl font-bold">#{session.sessionNumber}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-500" />
            <span className="font-medium text-gray-700">
              {formatDate(session.appointment.date)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {session.appointment.startTime} - {session.appointment.endTime}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{session.therapist.name}</span>
            </div>
          </div>
          {/* Activities preview */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {activities.map((activity) => (
                <span
                  key={activity.key}
                  className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                >
                  {activity.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status badges and expand button */}
        <div className="flex items-center gap-2">
          {session.evaluation ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              {t("session.evaluated")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              <FileText className="h-3 w-3" />
              {t("session.pendingEvaluation")}
            </span>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-teal-50">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-teal-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-teal-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content - Evaluation details */}
      {isExpanded && session.evaluation && (
        <div className="border-t border-teal-100 bg-gradient-to-b from-teal-50/50 to-transparent p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activities performed */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Activity className="h-4 w-4 text-teal-500" />
                {t("session.evaluationForm.activitiesSection")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <span
                      key={activity.key}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm"
                    >
                      <span>{activity.emoji}</span>
                      <span className="text-gray-700">
                        {t(`session.evaluationForm.activities.${activity.key}`)}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
                {session.evaluation.otherActivities && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm">
                    <span>📝</span>
                    <span className="text-gray-700">{session.evaluation.otherActivities}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Sensory evaluation */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Eye className="h-4 w-4 text-teal-500" />
                {t("session.evaluationForm.sensorySection")}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-xl bg-white p-2 shadow-sm">
                  <Eye className="mb-1 h-4 w-4 text-gray-400" />
                  <span className="text-[10px] text-gray-500">{t("session.evaluationForm.sensory.visualTracking")}</span>
                  <BooleanIndicator value={session.evaluation.visualTracking} />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-2 shadow-sm">
                  <Users className="mb-1 h-4 w-4 text-gray-400" />
                  <span className="text-[10px] text-gray-500">{t("session.evaluationForm.sensory.eyeContact")}</span>
                  <BooleanIndicator value={session.evaluation.eyeContact} />
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-2 shadow-sm">
                  <Ear className="mb-1 h-4 w-4 text-gray-400" />
                  <span className="text-[10px] text-gray-500">{t("session.evaluationForm.sensory.auditoryResponse")}</span>
                  <BooleanIndicator value={session.evaluation.auditoryResponse} />
                </div>
              </div>
            </div>

            {/* Muscle development */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Activity className="h-4 w-4 text-teal-500" />
                {t("session.evaluationForm.muscleSection")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {session.evaluation.muscleTone && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                      session.evaluation.muscleTone === "LOW" && "bg-amber-100 text-amber-700",
                      session.evaluation.muscleTone === "NORMAL" && "bg-emerald-100 text-emerald-700",
                      session.evaluation.muscleTone === "TENSE" && "bg-rose-100 text-rose-700"
                    )}
                  >
                    {t(`session.muscleTone.${session.evaluation.muscleTone.toLowerCase()}`)}
                  </span>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">{t("session.evaluationForm.muscle.cervicalControl")}:</span>
                  <BooleanIndicator value={session.evaluation.cervicalControl} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">{t("session.evaluationForm.muscle.headUp")}:</span>
                  <BooleanIndicator value={session.evaluation.headUp} />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="h-4 w-4 text-teal-500" />
                {t("session.evaluationForm.milestonesSection")}
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">{t("session.evaluationForm.milestones.sits")}:</span>
                  <BooleanIndicator value={session.evaluation.sits} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">{t("session.evaluationForm.milestones.crawls")}:</span>
                  <BooleanIndicator value={session.evaluation.crawls} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">{t("session.evaluationForm.milestones.walks")}:</span>
                  <BooleanIndicator value={session.evaluation.walks} />
                </div>
              </div>
            </div>

            {/* Mood */}
            {session.evaluation.mood && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <SmilePlus className="h-4 w-4 text-teal-500" />
                  {t("session.evaluationForm.moodSection")}
                </h4>
                <div className="flex items-center gap-2">
                  {session.evaluation.mood === "CALM" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                      <SmilePlus className="h-4 w-4" />
                      {t("session.mood.calm")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                      <Frown className="h-4 w-4" />
                      {t("session.mood.irritable")}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(session.evaluation.internalNotes || session.evaluation.externalNotes) && (
              <div className="space-y-2 md:col-span-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText className="h-4 w-4 text-teal-500" />
                  {t("session.evaluationForm.notesSection")}
                </h4>
                <div className="space-y-2">
                  {session.evaluation.internalNotes && (
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        {t("session.evaluationForm.notes.internal")}
                      </p>
                      <p className="text-sm text-gray-700">{session.evaluation.internalNotes}</p>
                    </div>
                  )}
                  {session.evaluation.externalNotes && (
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        {t("session.evaluationForm.notes.external")}
                      </p>
                      <p className="text-sm text-gray-700">{session.evaluation.externalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Package info */}
          {session.packagePurchase && (
            <div className="mt-4 border-t border-teal-100 pt-3">
              <span className="text-xs text-gray-400">
                {t("session.packageUsed")}: {session.packagePurchase.package.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Expanded content - No evaluation */}
      {isExpanded && !session.evaluation && (
        <div className="border-t border-teal-100 bg-gradient-to-b from-amber-50/50 to-transparent p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-amber-300" />
          <p className="mt-2 text-sm text-gray-500">{t("session.noEvaluation")}</p>
        </div>
      )}
    </div>
  );
}
