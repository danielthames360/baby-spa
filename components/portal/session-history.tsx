"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay, formatLocalDateString } from "@/lib/utils/date-utils";
import { getGenderGradient } from "@/lib/utils/gender-utils";
import {
  History,
  Baby,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scale,
  X,
  Minus,
  FileDown,
  CheckCircle,
  FileText,
  Eye,
  Users,
  Ear,
  Dumbbell,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBabyReport } from "@/lib/pdf/baby-report";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Evaluation {
  id: string;
  babyAgeMonths: number;
  babyWeight: string | null;
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
  externalNotes: string | null;
  createdAt: string;
}

interface SessionData {
  id: string;
  sessionNumber: number;
  completedAt: string | null;
  baby: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  };
  therapist: {
    name: string;
  };
  appointment: {
    date: string;
    startTime: string;
  };
  packagePurchase: {
    package: {
      name: string;
    };
  } | null;
  evaluation: Evaluation | null;
}

interface BabyFilter {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}

export function SessionHistory() {
  const t = useTranslations();
  const locale = useLocale();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [babies, setBabies] = useState<BabyFilter[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = selectedBabyId === "all"
          ? "/api/portal/sessions"
          : `/api/portal/sessions?babyId=${selectedBabyId}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setSessions(result.sessions);
        setBabies(result.babies);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBabyId]);

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const downloadPdf = async () => {
    if (selectedBabyId === "all" && babies.length > 1) {
      // If "all" selected and multiple babies, use first baby
      // Or you could show a dialog to select
      return;
    }

    const babyIdToUse = selectedBabyId === "all" ? babies[0]?.id : selectedBabyId;
    if (!babyIdToUse) return;

    setDownloadingPdf(true);
    try {
      // Get locale from URL
      const locale = window.location.pathname.includes("/pt-BR") ? "pt-BR" : "es";

      const response = await fetch(`/api/portal/report/${babyIdToUse}?locale=${locale}`);
      if (!response.ok) throw new Error("Failed to fetch report data");

      const reportData = await response.json();
      const doc = generateBabyReport(reportData);

      // Download the PDF
      const babyName = babies.find((b) => b.id === babyIdToUse)?.name || "baby";
      const fileName = `reporte-${babyName.toLowerCase().replace(/\s+/g, "-")}-${formatLocalDateString(new Date())}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-200">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("portal.history.title")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("portal.history.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Baby Filter */}
          {babies.length > 1 && (
            <Select value={selectedBabyId} onValueChange={setSelectedBabyId}>
              <SelectTrigger className="w-[200px] rounded-xl border-2 border-teal-100">
                <SelectValue placeholder={t("portal.history.selectBaby")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("portal.history.allBabies")}</SelectItem>
                {babies.map((baby) => (
                  <SelectItem key={baby.id} value={baby.id}>
                    {baby.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Download PDF Button */}
          {sessions.length > 0 && (selectedBabyId !== "all" || babies.length === 1) && (
            <Button
              variant="outline"
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="gap-2 rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {t("portal.history.downloadReport")}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-rose-600">{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <History className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-600">
            {t("portal.history.noSessions")}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {t("portal.history.noSessionsDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSession === session.id}
              onToggle={() => toggleExpand(session.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SessionCardProps {
  session: SessionData;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

function SessionCard({ session, isExpanded, onToggle, formatDate }: SessionCardProps) {
  const t = useTranslations();

  // Activities with emojis for preview
  const activities = [
    { key: "hydrotherapy", emoji: "💧", value: session.evaluation?.hydrotherapy },
    { key: "massage", emoji: "💆", value: session.evaluation?.massage },
    { key: "motorStimulation", emoji: "🏃", value: session.evaluation?.motorStimulation },
    { key: "sensoryStimulation", emoji: "✨", value: session.evaluation?.sensoryStimulation },
    { key: "relaxation", emoji: "😴", value: session.evaluation?.relaxation },
  ].filter((a) => a.value);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-teal-50/50"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white shadow-md",
              getGenderGradient(session.baby.gender)
            )}
          >
            #{session.sessionNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{session.baby.name}</h3>
              {session.packagePurchase && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                  {session.packagePurchase.package.name}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(session.appointment.date)}
              </span>
              <span>{session.appointment.startTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Activities preview with emojis */}
          <div className="hidden items-center gap-1 sm:flex">
            {activities.slice(0, 4).map((activity) => (
              <span
                key={activity.key}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-sm"
                title={t(`portal.activities.${activity.key}`)}
              >
                {activity.emoji}
              </span>
            ))}
            {activities.length > 4 && (
              <span className="text-xs text-gray-400">+{activities.length - 4}</span>
            )}
          </div>

          {/* Evaluation status badge */}
          {session.evaluation ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{t("portal.history.evaluated")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">{t("portal.history.pendingEvaluation")}</span>
            </span>
          )}

          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && session.evaluation && (
        <div className="border-t border-teal-100 p-4">
          <EvaluationDetails evaluation={session.evaluation} therapistName={session.therapist.name} />
        </div>
      )}
    </div>
  );
}

interface EvaluationDetailsProps {
  evaluation: Evaluation;
  therapistName: string;
}

function EvaluationDetails({ evaluation, therapistName }: EvaluationDetailsProps) {
  const t = useTranslations();

  const BooleanIndicator = ({ value }: { value: boolean | null }) => {
    if (value === null) {
      return <Minus className="h-4 w-4 text-gray-300" />;
    }
    return value ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    ) : (
      <X className="h-4 w-4 text-rose-400" />
    );
  };

  // Activities with emojis for a friendlier look
  const activities = [
    { key: "hydrotherapy", emoji: "💧", value: evaluation.hydrotherapy },
    { key: "massage", emoji: "💆", value: evaluation.massage },
    { key: "motorStimulation", emoji: "🏃", value: evaluation.motorStimulation },
    { key: "sensoryStimulation", emoji: "✨", value: evaluation.sensoryStimulation },
    { key: "relaxation", emoji: "😴", value: evaluation.relaxation },
  ];

  const activeActivities = activities.filter((a) => a.value);

  return (
    <div className="space-y-6 bg-gradient-to-b from-teal-50/50 to-transparent rounded-xl p-4">
      {/* Meta info - More visual */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
          <User className="h-4 w-4 text-teal-500" />
          <span className="text-sm text-gray-700">
            <strong>{therapistName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
          <Baby className="h-4 w-4 text-teal-500" />
          <span className="text-sm text-gray-700">
            <strong>{evaluation.babyAgeMonths}</strong> {t("common.months")}
          </span>
        </div>
        {evaluation.babyWeight && (
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <Scale className="h-4 w-4 text-teal-500" />
            <span className="text-sm text-gray-700">
              <strong>{evaluation.babyWeight}</strong> kg
            </span>
          </div>
        )}
      </div>

      {/* Activities - With emojis */}
      {activeActivities.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Star className="h-4 w-4 text-amber-500" />
            {t("portal.history.activities")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeActivities.map((activity) => (
              <span
                key={activity.key}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm transition-transform hover:scale-105"
              >
                <span className="text-lg">{activity.emoji}</span>
                <span className="text-gray-700">
                  {t(`portal.activities.${activity.key}`)}
                </span>
              </span>
            ))}
            {evaluation.otherActivities && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm">
                <span className="text-lg">📝</span>
                <span className="text-gray-700">{evaluation.otherActivities}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Evaluation Grid - More visual with icons */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sensory - Card style with icons */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h5 className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-700">
            <Eye className="h-4 w-4" />
            {t("portal.evaluation.sensory")}
          </h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-xl bg-sky-50 p-3">
              <Eye className="mb-1 h-5 w-5 text-sky-400" />
              <span className="mb-1 text-center text-[10px] text-gray-500">{t("portal.evaluation.visualTracking")}</span>
              <BooleanIndicator value={evaluation.visualTracking} />
            </div>
            <div className="flex flex-col items-center rounded-xl bg-sky-50 p-3">
              <Users className="mb-1 h-5 w-5 text-sky-400" />
              <span className="mb-1 text-center text-[10px] text-gray-500">{t("portal.evaluation.eyeContact")}</span>
              <BooleanIndicator value={evaluation.eyeContact} />
            </div>
            <div className="flex flex-col items-center rounded-xl bg-sky-50 p-3">
              <Ear className="mb-1 h-5 w-5 text-sky-400" />
              <span className="mb-1 text-center text-[10px] text-gray-500">{t("portal.evaluation.auditoryResponse")}</span>
              <BooleanIndicator value={evaluation.auditoryResponse} />
            </div>
          </div>
        </div>

        {/* Motor - Card style */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h5 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Dumbbell className="h-4 w-4" />
            {t("portal.evaluation.motor")}
          </h5>
          <div className="space-y-3">
            {evaluation.muscleTone && (
              <div className="flex justify-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium",
                    evaluation.muscleTone === "LOW" && "bg-amber-100 text-amber-700",
                    evaluation.muscleTone === "NORMAL" && "bg-emerald-100 text-emerald-700",
                    evaluation.muscleTone === "TENSE" && "bg-rose-100 text-rose-700"
                  )}
                >
                  {t(`portal.evaluation.muscleTones.${evaluation.muscleTone}`)}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="text-xs text-gray-600">{t("portal.evaluation.cervicalControl")}</span>
                <BooleanIndicator value={evaluation.cervicalControl} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="text-xs text-gray-600">{t("portal.evaluation.headUp")}</span>
                <BooleanIndicator value={evaluation.headUp} />
              </div>
            </div>
          </div>
        </div>

        {/* Milestones - Visual progress */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h5 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4" />
            {t("portal.evaluation.milestones")}
          </h5>
          <div className="flex justify-around">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
                evaluation.sits ? "bg-amber-100" : "bg-gray-100"
              )}>
                🪑
              </div>
              <span className="text-[10px] text-gray-500">{t("portal.evaluation.sits")}</span>
              <BooleanIndicator value={evaluation.sits} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
                evaluation.crawls ? "bg-amber-100" : "bg-gray-100"
              )}>
                🐛
              </div>
              <span className="text-[10px] text-gray-500">{t("portal.evaluation.crawls")}</span>
              <BooleanIndicator value={evaluation.crawls} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
                evaluation.walks ? "bg-amber-100" : "bg-gray-100"
              )}>
                🚶
              </div>
              <span className="text-[10px] text-gray-500">{t("portal.evaluation.walks")}</span>
              <BooleanIndicator value={evaluation.walks} />
            </div>
          </div>
        </div>

        {/* Mood - Big emoji */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h5 className="mb-4 flex items-center gap-2 text-sm font-semibold text-rose-700">
            {evaluation.mood === "CALM" ? "😊" : evaluation.mood === "IRRITABLE" ? "😢" : "😐"}
            {t("portal.evaluation.mood")}
          </h5>
          <div className="flex flex-col items-center justify-center py-2">
            {evaluation.mood === "CALM" ? (
              <>
                <span className="text-5xl">😊</span>
                <span className="mt-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-700">
                  {t("portal.evaluation.moods.CALM")}
                </span>
              </>
            ) : evaluation.mood === "IRRITABLE" ? (
              <>
                <span className="text-5xl">😢</span>
                <span className="mt-2 rounded-full bg-amber-100 px-4 py-1 text-sm font-medium text-amber-700">
                  {t("portal.evaluation.moods.IRRITABLE")}
                </span>
              </>
            ) : (
              <>
                <span className="text-5xl">😐</span>
                <span className="mt-2 text-sm text-gray-400">
                  {t("portal.evaluation.notEvaluated")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* External Notes */}
      {evaluation.externalNotes && (
        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
          <h5 className="mb-2 text-sm font-medium text-teal-700">
            {t("portal.history.notes")}
          </h5>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {evaluation.externalNotes}
          </p>
        </div>
      )}
    </div>
  );
}
