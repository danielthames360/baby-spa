"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  History,
  Baby,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Droplets,
  Hand,
  Activity,
  Sparkles,
  Heart,
  Scale,
  Check,
  X,
  Minus,
  FileDown,
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
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
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
      const fileName = `reporte-${babyName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
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

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "from-sky-400 to-blue-500";
      case "FEMALE":
        return "from-rose-400 to-pink-500";
      default:
        return "from-teal-400 to-cyan-500";
    }
  };

  const activities = [
    { key: "hydrotherapy", icon: Droplets, value: session.evaluation?.hydrotherapy },
    { key: "massage", icon: Hand, value: session.evaluation?.massage },
    { key: "motorStimulation", icon: Activity, value: session.evaluation?.motorStimulation },
    { key: "sensoryStimulation", icon: Sparkles, value: session.evaluation?.sensoryStimulation },
    { key: "relaxation", icon: Heart, value: session.evaluation?.relaxation },
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
              getGenderColor(session.baby.gender)
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
          {/* Activities preview */}
          <div className="hidden items-center gap-1 sm:flex">
            {activities.slice(0, 3).map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.key}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50"
                >
                  <Icon className="h-3.5 w-3.5 text-teal-600" />
                </div>
              );
            })}
            {activities.length > 3 && (
              <span className="text-xs text-gray-400">+{activities.length - 3}</span>
            )}
          </div>

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
      <Check className="h-4 w-4 text-emerald-500" />
    ) : (
      <X className="h-4 w-4 text-rose-400" />
    );
  };

  const activities = [
    { key: "hydrotherapy", icon: Droplets, value: evaluation.hydrotherapy },
    { key: "massage", icon: Hand, value: evaluation.massage },
    { key: "motorStimulation", icon: Activity, value: evaluation.motorStimulation },
    { key: "sensoryStimulation", icon: Sparkles, value: evaluation.sensoryStimulation },
    { key: "relaxation", icon: Heart, value: evaluation.relaxation },
  ];

  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {t("portal.history.therapist")}: <strong>{therapistName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
          <Baby className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {t("portal.history.babyAge")}: <strong>{evaluation.babyAgeMonths} {t("common.months")}</strong>
          </span>
        </div>
        {evaluation.babyWeight && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
            <Scale className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {t("portal.history.babyWeight")}: <strong>{evaluation.babyWeight} kg</strong>
            </span>
          </div>
        )}
      </div>

      {/* Activities */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          {t("portal.history.activities")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {activities
            .filter((a) => a.value)
            .map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.key}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 px-3 py-1.5"
                >
                  <Icon className="h-4 w-4 text-teal-600" />
                  <span className="text-sm text-teal-700">
                    {t(`portal.activities.${activity.key}`)}
                  </span>
                </div>
              );
            })}
          {evaluation.otherActivities && (
            <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
              {evaluation.otherActivities}
            </div>
          )}
        </div>
      </div>

      {/* Evaluation Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Sensory */}
        <div className="rounded-xl bg-sky-50 p-4">
          <h5 className="mb-3 text-sm font-medium text-sky-700">
            {t("portal.evaluation.sensory")}
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.visualTracking")}</span>
              <BooleanIndicator value={evaluation.visualTracking} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.eyeContact")}</span>
              <BooleanIndicator value={evaluation.eyeContact} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.auditoryResponse")}</span>
              <BooleanIndicator value={evaluation.auditoryResponse} />
            </div>
          </div>
        </div>

        {/* Motor */}
        <div className="rounded-xl bg-emerald-50 p-4">
          <h5 className="mb-3 text-sm font-medium text-emerald-700">
            {t("portal.evaluation.motor")}
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.muscleTone")}</span>
              <span className="font-medium text-gray-700">
                {evaluation.muscleTone
                  ? t(`portal.evaluation.muscleTones.${evaluation.muscleTone}`)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.cervicalControl")}</span>
              <BooleanIndicator value={evaluation.cervicalControl} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.headUp")}</span>
              <BooleanIndicator value={evaluation.headUp} />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-xl bg-amber-50 p-4">
          <h5 className="mb-3 text-sm font-medium text-amber-700">
            {t("portal.evaluation.milestones")}
          </h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.sits")}</span>
              <BooleanIndicator value={evaluation.sits} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.crawls")}</span>
              <BooleanIndicator value={evaluation.crawls} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("portal.evaluation.walks")}</span>
              <BooleanIndicator value={evaluation.walks} />
            </div>
          </div>
        </div>

        {/* Mood */}
        <div className="rounded-xl bg-rose-50 p-4">
          <h5 className="mb-3 text-sm font-medium text-rose-700">
            {t("portal.evaluation.mood")}
          </h5>
          <div className="flex items-center gap-2">
            {evaluation.mood === "CALM" ? (
              <>
                <span className="text-2xl">😊</span>
                <span className="text-sm text-gray-600">
                  {t("portal.evaluation.moods.CALM")}
                </span>
              </>
            ) : evaluation.mood === "IRRITABLE" ? (
              <>
                <span className="text-2xl">😢</span>
                <span className="text-sm text-gray-600">
                  {t("portal.evaluation.moods.IRRITABLE")}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">
                {t("portal.evaluation.notEvaluated")}
              </span>
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
