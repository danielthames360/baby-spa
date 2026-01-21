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
import {
  Loader2,
  FileText,
  Baby,
  Activity,
  Brain,
  Heart,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewEvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

interface Evaluation {
  id: string;
  babyAgeMonths: number;
  babyWeight: number | null;
  hydrotherapy: boolean;
  massage: boolean;
  motorStimulation: boolean;
  sensoryStimulation: boolean;
  relaxation: boolean;
  otherActivities: string | null;
  visualTracking: boolean | null;
  eyeContact: boolean | null;
  auditoryResponse: boolean | null;
  muscleTone: "LOW" | "NORMAL" | "TENSE" | null;
  cervicalControl: boolean | null;
  headUp: boolean | null;
  sits: boolean | null;
  crawls: boolean | null;
  walks: boolean | null;
  mood: "CALM" | "IRRITABLE" | null;
  internalNotes: string | null;
  externalNotes: string | null;
  createdAt: string;
}

interface SessionData {
  id: string;
  sessionNumber: number;
  baby: {
    name: string;
  };
  evaluation: Evaluation | null;
}

export function ViewEvaluationDialog({
  open,
  onOpenChange,
  sessionId,
}: ViewEvaluationDialogProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open && sessionId) {
      fetchSession();
    }
  }, [open, sessionId, fetchSession]);

  const BooleanValue = ({ value }: { value: boolean | null | undefined }) => {
    if (value === null || value === undefined) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    return value ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    ) : (
      <XCircle className="h-4 w-4 text-rose-400" />
    );
  };

  const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <h3 className="font-semibold text-gray-700">{children}</h3>
    </div>
  );

  const evaluation = session?.evaluation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            {t("session.viewEvaluationTitle")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : !evaluation ? (
          <div className="py-8 text-center text-gray-500">
            {t("session.noEvaluation")}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Baby Info */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{session?.baby.name}</p>
                <p className="text-sm text-emerald-600">
                  {t("session.sessionNumber", { number: session?.sessionNumber })} • {evaluation.babyAgeMonths} {t("common.months")}
                  {evaluation.babyWeight && ` • ${evaluation.babyWeight} kg`}
                </p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              <SectionTitle icon={Activity}>
                {t("session.form.activities")}
              </SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "hydrotherapy", label: t("session.activities.hydrotherapy"), value: evaluation.hydrotherapy },
                  { key: "massage", label: t("session.activities.massage"), value: evaluation.massage },
                  { key: "motorStimulation", label: t("session.activities.motorStimulation"), value: evaluation.motorStimulation },
                  { key: "sensoryStimulation", label: t("session.activities.sensoryStimulation"), value: evaluation.sensoryStimulation },
                  { key: "relaxation", label: t("session.activities.relaxation"), value: evaluation.relaxation },
                ].map(({ key, label, value }) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-2",
                      value ? "bg-emerald-50" : "bg-gray-50"
                    )}
                  >
                    <BooleanValue value={value} />
                    <span className={cn("text-sm", value ? "text-emerald-700" : "text-gray-500")}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              {evaluation.otherActivities && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t("session.form.otherActivities")}:</p>
                  <p className="text-sm text-gray-700">{evaluation.otherActivities}</p>
                </div>
              )}
            </div>

            {/* Sensory Evaluation */}
            <div className="space-y-3">
              <SectionTitle icon={Brain}>
                {t("session.form.sensoryEvaluation")}
              </SectionTitle>
              <div className="space-y-2">
                {[
                  { label: t("session.evaluation.visualTracking"), value: evaluation.visualTracking },
                  { label: t("session.evaluation.eyeContact"), value: evaluation.eyeContact },
                  { label: t("session.evaluation.auditoryResponse"), value: evaluation.auditoryResponse },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                    <span className="text-sm text-gray-600">{label}</span>
                    <BooleanValue value={value} />
                  </div>
                ))}
              </div>
            </div>

            {/* Muscle Development */}
            <div className="space-y-3">
              <SectionTitle icon={Activity}>
                {t("session.form.muscleDevelopment")}
              </SectionTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                  <span className="text-sm text-gray-600">{t("session.evaluation.muscleTone")}</span>
                  <span className={cn(
                    "text-sm font-medium rounded-full px-2 py-0.5",
                    evaluation.muscleTone === "LOW" && "bg-blue-100 text-blue-700",
                    evaluation.muscleTone === "NORMAL" && "bg-emerald-100 text-emerald-700",
                    evaluation.muscleTone === "TENSE" && "bg-amber-100 text-amber-700",
                    !evaluation.muscleTone && "text-gray-400"
                  )}>
                    {evaluation.muscleTone ? t(`session.muscleTone.${evaluation.muscleTone.toLowerCase()}`) : "-"}
                  </span>
                </div>
                {[
                  { label: t("session.evaluation.cervicalControl"), value: evaluation.cervicalControl },
                  { label: t("session.evaluation.headUp"), value: evaluation.headUp },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                    <span className="text-sm text-gray-600">{label}</span>
                    <BooleanValue value={value} />
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <SectionTitle icon={Baby}>
                {t("session.form.milestones")}
              </SectionTitle>
              <div className="space-y-2">
                {[
                  { label: t("session.milestones.sits"), value: evaluation.sits },
                  { label: t("session.milestones.crawls"), value: evaluation.crawls },
                  { label: t("session.milestones.walks"), value: evaluation.walks },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                    <span className="text-sm text-gray-600">{label}</span>
                    <BooleanValue value={value} />
                  </div>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-3">
              <SectionTitle icon={Heart}>
                {t("session.form.moodSection")}
              </SectionTitle>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2">
                <span className="text-sm text-gray-600">{t("session.evaluation.mood")}</span>
                <span className={cn(
                  "text-sm font-medium rounded-full px-2 py-0.5",
                  evaluation.mood === "CALM" && "bg-emerald-100 text-emerald-700",
                  evaluation.mood === "IRRITABLE" && "bg-amber-100 text-amber-700",
                  !evaluation.mood && "text-gray-400"
                )}>
                  {evaluation.mood ? t(`session.mood.${evaluation.mood.toLowerCase()}`) : "-"}
                </span>
              </div>
            </div>

            {/* Notes */}
            {(evaluation.internalNotes || evaluation.externalNotes) && (
              <div className="space-y-3">
                <SectionTitle icon={FileText}>
                  {t("session.form.notes")}
                </SectionTitle>
                {evaluation.internalNotes && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-600">
                      {t("session.form.internalNotes")}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{evaluation.internalNotes}</p>
                  </div>
                )}
                {evaluation.externalNotes && (
                  <div className="rounded-lg bg-teal-50 p-3">
                    <p className="text-xs font-medium text-teal-600">
                      {t("session.form.externalNotes")}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{evaluation.externalNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => onOpenChange(false)}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white"
              >
                {t("common.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
