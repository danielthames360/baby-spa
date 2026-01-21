"use client";

import { useTranslations } from "next-intl";
import { Baby, Clock, CheckCircle, AlertCircle, FileEdit, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TherapistSessionCardProps {
  appointment: {
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
  };
  onEvaluate: (sessionId: string) => void;
  onViewEvaluation: (sessionId: string) => void;
}

export function TherapistSessionCard({
  appointment,
  onEvaluate,
  onViewEvaluation,
}: TherapistSessionCardProps) {
  const t = useTranslations();

  // Calculate baby age
  const birthDate = new Date(appointment.baby.birthDate);
  const today = new Date();
  const ageMonths = Math.floor(
    (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  const ageDisplay =
    ageMonths < 12
      ? `${ageMonths} ${t("common.months")}`
      : ageMonths < 24
      ? `1 ${t("common.year")} ${ageMonths - 12 > 0 ? `${ageMonths - 12} ${t("common.months")}` : ""}`
      : `${Math.floor(ageMonths / 12)} ${t("common.years")}`;

  // Status colors and badges
  const getStatusConfig = () => {
    switch (appointment.status) {
      case "SCHEDULED":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          label: t("calendar.status.scheduled"),
          gradient: "from-amber-400 to-orange-400",
          shadow: "shadow-amber-200",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          label: t("calendar.status.inProgress"),
          gradient: "from-blue-500 to-cyan-500",
          shadow: "shadow-blue-200",
        };
      case "COMPLETED":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          label: t("calendar.status.completed"),
          gradient: "from-emerald-500 to-teal-500",
          shadow: "shadow-emerald-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          label: appointment.status,
          gradient: "from-gray-400 to-gray-500",
          shadow: "shadow-gray-200",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const canEvaluate =
    !appointment.isEvaluated &&
    appointment.session &&
    (appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED");
  const hasEvaluation = appointment.isEvaluated && appointment.session;

  return (
    <div
      className={cn(
        "group rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        appointment.status === "IN_PROGRESS" && "ring-2 ring-blue-300"
      )}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        {/* Time badge */}
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-14 sm:w-14",
            `${statusConfig.gradient} ${statusConfig.shadow}`
          )}
        >
          <Clock className="h-3 w-3 opacity-80 sm:h-4 sm:w-4" />
          <span className="text-xs font-bold sm:text-sm">{appointment.startTime}</span>
        </div>

        {/* Baby avatar - hidden on mobile */}
        <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 sm:flex">
          <Baby className="h-6 w-6 text-teal-600" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold text-gray-800">{appointment.baby.name}</p>
            {appointment.baby.parents?.[0]?.parent?.name && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User className="h-3 w-3" />
                {appointment.baby.parents[0].parent.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{ageDisplay}</p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusConfig.bg,
                statusConfig.text
              )}
            >
              {statusConfig.label}
            </span>

            {/* Evaluation status badge */}
            {appointment.status !== "SCHEDULED" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  appointment.isEvaluated
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {appointment.isEvaluated ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    {t("session.evaluated")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    {t("session.pendingEvaluation")}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - desktop only */}
        <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
          {canEvaluate && (
            <Button
              onClick={() => onEvaluate(appointment.session!.id)}
              className={cn(
                "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 text-white shadow-md shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-lg"
              )}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              {t("session.evaluate")}
            </Button>
          )}

          {hasEvaluation && (
            <Button
              variant="outline"
              onClick={() => onViewEvaluation(appointment.session!.id)}
              className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t("session.viewEvaluation")}
            </Button>
          )}

          {appointment.status === "SCHEDULED" && (
            <span className="text-sm text-gray-400">
              {t("session.waitingToStart")}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons - mobile only */}
      <div className="mt-3 flex items-center justify-end gap-2 sm:hidden">
        {canEvaluate && (
          <Button
            onClick={() => onEvaluate(appointment.session!.id)}
            size="sm"
            className={cn(
              "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200 transition-all hover:from-teal-600 hover:to-cyan-600"
            )}
          >
            <FileEdit className="mr-1.5 h-3.5 w-3.5" />
            {t("session.evaluate")}
          </Button>
        )}

        {hasEvaluation && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewEvaluation(appointment.session!.id)}
            className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {t("session.viewEvaluation")}
          </Button>
        )}

        {appointment.status === "SCHEDULED" && (
          <span className="text-xs text-gray-400">
            {t("session.waitingToStart")}
          </span>
        )}
      </div>
    </div>
  );
}
