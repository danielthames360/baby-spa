"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  Activity,
  Brain,
  Heart,
  FileText,
  Baby,
  Minus,
  Smile,
  Frown,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Extracted sub-components defined OUTSIDE the main component to prevent recreation on every render

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-teal-100 pb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <h3 className="font-semibold text-gray-700">{children}</h3>
    </div>
  );
}

// Visual tri-state toggle for boolean values
function TriStateToggle({
  value,
  onChange,
  label,
  yesLabel,
  noLabel,
}: {
  value: boolean | undefined;
  onChange: (val: boolean | undefined) => void;
  label: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50/80 p-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange(value === true ? undefined : true)}
          className={cn(
            "flex h-8 min-w-[40px] items-center justify-center rounded-md px-2 text-xs font-semibold transition-all",
            value === true
              ? "bg-emerald-500 text-white shadow-md"
              : "text-gray-400 hover:bg-emerald-50 hover:text-emerald-500"
          )}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-all",
            value === undefined
              ? "bg-gray-200 text-gray-600 shadow-md"
              : "text-gray-400 hover:bg-gray-100"
          )}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? undefined : false)}
          className={cn(
            "flex h-8 min-w-[40px] items-center justify-center rounded-md px-2 text-xs font-semibold transition-all",
            value === false
              ? "bg-rose-500 text-white shadow-md"
              : "text-gray-400 hover:bg-rose-50 hover:text-rose-500"
          )}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}

// Segmented control for muscle tone
function MuscleToneSelector({
  value,
  onChange,
  label,
  options,
}: {
  value: "LOW" | "NORMAL" | "TENSE" | undefined;
  onChange: (val: "LOW" | "NORMAL" | "TENSE" | undefined) => void;
  label: string;
  options: Array<{ value: string; label: string; color: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50/80 p-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
        {options.map(({ value: optValue, label: optLabel, color }) => (
          <button
            key={optValue}
            type="button"
            onClick={() =>
              onChange(value === optValue ? undefined : (optValue as "LOW" | "NORMAL" | "TENSE"))
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              value === optValue
                ? color === "blue"
                  ? "bg-blue-500 text-white shadow-md"
                  : color === "emerald"
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-amber-500 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100"
            )}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

// Mood selector with icons
function MoodSelector({
  value,
  onChange,
  calmLabel,
  irritableLabel,
}: {
  value: "CALM" | "IRRITABLE" | undefined;
  onChange: (val: "CALM" | "IRRITABLE" | undefined) => void;
  calmLabel: string;
  irritableLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50/80 p-3">
      <span className="text-sm font-medium text-gray-700">
        {/* Label passed as child or use mood section label */}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(value === "CALM" ? undefined : "CALM")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 transition-all",
            value === "CALM"
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-white text-gray-500 shadow-sm hover:bg-emerald-50 hover:text-emerald-600"
          )}
        >
          <Smile className="h-4 w-4" />
          <span className="text-sm font-medium">{calmLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(value === "IRRITABLE" ? undefined : "IRRITABLE")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 transition-all",
            value === "IRRITABLE"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-white text-gray-500 shadow-sm hover:bg-amber-50 hover:text-amber-600"
          )}
        >
          <Frown className="h-4 w-4" />
          <span className="text-sm font-medium">{irritableLabel}</span>
        </button>
      </div>
    </div>
  );
}

interface EvaluationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  babyName: string;
  babyAgeMonths: number;
  parentName?: string;
  onSuccess?: () => void;
}

export function EvaluationForm({
  open,
  onOpenChange,
  sessionId,
  babyName,
  babyAgeMonths,
  parentName,
  onSuccess,
}: EvaluationFormProps) {
  const t = useTranslations();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Activities
    hydrotherapy: false,
    massage: false,
    motorStimulation: false,
    sensoryStimulation: false,
    relaxation: false,
    otherActivities: "",
    // Sensory
    visualTracking: undefined as boolean | undefined,
    eyeContact: undefined as boolean | undefined,
    auditoryResponse: undefined as boolean | undefined,
    // Muscle development
    muscleTone: undefined as "LOW" | "NORMAL" | "TENSE" | undefined,
    cervicalControl: undefined as boolean | undefined,
    headUp: undefined as boolean | undefined,
    // Milestones
    sits: undefined as boolean | undefined,
    crawls: undefined as boolean | undefined,
    walks: undefined as boolean | undefined,
    // State
    mood: undefined as "CALM" | "IRRITABLE" | undefined,
    // Notes
    internalNotes: "",
    externalNotes: "",
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Validate at least one activity is selected
    const hasActivity =
      formData.hydrotherapy ||
      formData.massage ||
      formData.motorStimulation ||
      formData.sensoryStimulation ||
      formData.relaxation ||
      formData.otherActivities;

    if (!hasActivity) {
      setError(t("session.errors.NO_ACTIVITIES"));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyAgeMonths,
          hydrotherapy: formData.hydrotherapy,
          massage: formData.massage,
          motorStimulation: formData.motorStimulation,
          sensoryStimulation: formData.sensoryStimulation,
          relaxation: formData.relaxation,
          otherActivities: formData.otherActivities || undefined,
          visualTracking: formData.visualTracking,
          eyeContact: formData.eyeContact,
          auditoryResponse: formData.auditoryResponse,
          muscleTone: formData.muscleTone,
          cervicalControl: formData.cervicalControl,
          headUp: formData.headUp,
          sits: formData.sits,
          crawls: formData.crawls,
          walks: formData.walks,
          mood: formData.mood,
          internalNotes: formData.internalNotes || undefined,
          externalNotes: formData.externalNotes || undefined,
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
      console.error("Error saving evaluation:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Translated labels for extracted sub-components
  const yesLabel = t("common.yes");
  const noLabel = t("common.no");

  // Muscle tone options (stable reference via useMemo to prevent MuscleToneSelector re-renders)
  const muscleToneOptions = [
    { value: "LOW", label: t("session.muscleTone.low"), color: "blue" },
    { value: "NORMAL", label: t("session.muscleTone.normal"), color: "emerald" },
    { value: "TENSE", label: t("session.muscleTone.tense"), color: "amber" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            {t("session.evaluationForm.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Baby Info */}
          <div className="flex items-center gap-3 rounded-xl bg-teal-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{babyName}</p>
              <p className="text-sm text-teal-600">
                {babyAgeMonths} {t("common.months")}
              </p>
            </div>
            {parentName && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User className="h-3.5 w-3.5" />
                <span>{parentName}</span>
              </div>
            )}
          </div>

          {/* Sensory Evaluation */}
          <div className="space-y-3">
            <SectionTitle icon={Brain}>
              {t("session.form.sensoryEvaluation")}
            </SectionTitle>
            <div className="space-y-2">
              <TriStateToggle
                value={formData.visualTracking}
                onChange={(v) => setFormData({ ...formData, visualTracking: v })}
                label={t("session.evaluation.visualTracking")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <TriStateToggle
                value={formData.eyeContact}
                onChange={(v) => setFormData({ ...formData, eyeContact: v })}
                label={t("session.evaluation.eyeContact")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <TriStateToggle
                value={formData.auditoryResponse}
                onChange={(v) => setFormData({ ...formData, auditoryResponse: v })}
                label={t("session.evaluation.auditoryResponse")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
            </div>
          </div>

          {/* Muscle Development */}
          <div className="space-y-3">
            <SectionTitle icon={Activity}>
              {t("session.form.muscleDevelopment")}
            </SectionTitle>
            <div className="space-y-2">
              <MuscleToneSelector
                value={formData.muscleTone}
                onChange={(v) => setFormData({ ...formData, muscleTone: v })}
                label={t("session.evaluation.muscleTone")}
                options={muscleToneOptions}
              />
              <TriStateToggle
                value={formData.cervicalControl}
                onChange={(v) => setFormData({ ...formData, cervicalControl: v })}
                label={t("session.evaluation.cervicalControl")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <TriStateToggle
                value={formData.headUp}
                onChange={(v) => setFormData({ ...formData, headUp: v })}
                label={t("session.evaluation.headUp")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <SectionTitle icon={Baby}>
              {t("session.form.milestones")}
            </SectionTitle>
            <div className="space-y-2">
              <TriStateToggle
                value={formData.sits}
                onChange={(v) => setFormData({ ...formData, sits: v })}
                label={t("session.milestones.sits")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <TriStateToggle
                value={formData.crawls}
                onChange={(v) => setFormData({ ...formData, crawls: v })}
                label={t("session.milestones.crawls")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
              <TriStateToggle
                value={formData.walks}
                onChange={(v) => setFormData({ ...formData, walks: v })}
                label={t("session.milestones.walks")}
                yesLabel={yesLabel}
                noLabel={noLabel}
              />
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <SectionTitle icon={Heart}>
              {t("session.form.moodSection")}
            </SectionTitle>
            <MoodSelector
              value={formData.mood}
              onChange={(v) => setFormData({ ...formData, mood: v })}
              calmLabel={t("session.mood.calm")}
              irritableLabel={t("session.mood.irritable")}
            />
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <SectionTitle icon={Activity}>
              {t("session.form.activities")}
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { key: "hydrotherapy", label: t("session.activities.hydrotherapy"), emoji: "💧" },
                { key: "massage", label: t("session.activities.massage"), emoji: "🙌" },
                { key: "motorStimulation", label: t("session.activities.motorStimulation"), emoji: "🏃" },
                { key: "sensoryStimulation", label: t("session.activities.sensoryStimulation"), emoji: "✨" },
                { key: "relaxation", label: t("session.activities.relaxation"), emoji: "😌" },
              ].map(({ key, label, emoji }) => {
                const isChecked = formData[key as keyof typeof formData] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, [key]: !isChecked })}
                    className={cn(
                      "flex items-center gap-2 rounded-xl p-3 text-left transition-all",
                      isChecked
                        ? "bg-teal-500 text-white shadow-md shadow-teal-200"
                        : "bg-white text-gray-600 shadow-sm hover:bg-teal-50 hover:text-teal-700"
                    )}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">
                {t("session.form.otherActivities")}
              </Label>
              <Input
                value={formData.otherActivities}
                onChange={(e) =>
                  setFormData({ ...formData, otherActivities: e.target.value })
                }
                placeholder={t("session.form.otherActivitiesPlaceholder")}
                className="rounded-xl border-2 border-teal-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <SectionTitle icon={FileText}>
              {t("session.form.notes")}
            </SectionTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">
                  {t("session.form.internalNotes")}
                </Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, internalNotes: e.target.value })
                  }
                  placeholder={t("session.form.internalNotesPlaceholder")}
                  className="min-h-[80px] rounded-xl border-2 border-amber-100 bg-amber-50/50"
                />
                <p className="text-xs text-amber-600">
                  {t("session.form.internalNotesHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">
                  {t("session.form.externalNotes")}
                </Label>
                <Textarea
                  value={formData.externalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, externalNotes: e.target.value })
                  }
                  placeholder={t("session.form.externalNotesPlaceholder")}
                  className="min-h-[80px] rounded-xl border-2 border-teal-100"
                />
                <p className="text-xs text-teal-600">
                  {t("session.form.externalNotesHint")}
                </p>
              </div>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("session.saveEvaluation")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
