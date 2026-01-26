"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Baby,
  User,
  Phone,
  Mail,
  Calendar,
  CalendarDays,
  CalendarClock,
  Package,
  FileText,
  Loader2,
  Edit,
  Copy,
  Check,
  MessageCircle,
  Plus,
  Trash2,
  Star,
  Heart,
  Activity,
  Pill,
  Stethoscope,
  ClipboardList,
  Info,
  XCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogDestructiveAction,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";
import { calculateExactAge, formatAge } from "@/lib/utils/age";
import { SessionHistoryCard } from "@/components/sessions/session-history-card";
import { PackageInstallmentsCard } from "@/components/packages/package-installments-card";
import { Prisma } from "@prisma/client";

// bundle-dynamic-imports: Lazy load all dialog components to reduce initial bundle
const AddParentDialog = dynamic(
  () => import("@/components/babies/add-parent-dialog").then((mod) => mod.AddParentDialog),
  { ssr: false }
);
const SellPackageDialog = dynamic(
  () => import("@/components/packages/sell-package-dialog").then((mod) => mod.SellPackageDialog),
  { ssr: false }
);
const ScheduleAppointmentDialog = dynamic(
  () => import("@/components/appointments/schedule-appointment-dialog").then((mod) => mod.ScheduleAppointmentDialog),
  { ssr: false }
);
const RegisterInstallmentPaymentDialog = dynamic(
  () => import("@/components/packages/register-installment-payment-dialog").then((mod) => mod.RegisterInstallmentPaymentDialog),
  { ssr: false }
);
const BulkSchedulingDialog = dynamic(
  () => import("@/components/appointments/bulk-scheduling-dialog").then((mod) => mod.BulkSchedulingDialog),
  { ssr: false }
);

interface BabyWithRelations {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  birthWeeks: number | null;
  birthWeight: string | null;
  birthType: string | null;
  birthDifficulty: boolean;
  birthDifficultyDesc: string | null;
  pregnancyIssues: boolean;
  pregnancyIssuesDesc: string | null;
  priorStimulation: boolean;
  priorStimulationType: string | null;
  developmentDiagnosis: boolean;
  developmentDiagnosisDesc: string | null;
  diagnosedIllness: boolean;
  diagnosedIllnessDesc: string | null;
  recentMedication: boolean;
  recentMedicationDesc: string | null;
  allergies: string | null;
  specialObservations: string | null;
  socialMediaConsent: boolean;
  instagramHandle: string | null;
  referralSource: string | null;
  isActive: boolean;
  parents: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
      accessCode: string;
      noShowCount: number;
      requiresPrepayment: boolean;
    };
  }[];
  packagePurchases: {
    id: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    isActive: boolean;
    // Payment plan fields
    paymentPlan: string;
    installments: number;
    installmentAmount: Prisma.Decimal | null;
    paidAmount: Prisma.Decimal;
    finalPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal | null;
    installmentsPayOnSessions: string | null;
    // Schedule preferences from parent
    schedulePreferences: string | null;
    package: {
      id: string;
      name: string;
      duration: number;
    };
    installmentPayments?: {
      id: string;
      installmentNumber: number;
      amount: Prisma.Decimal;
      paymentMethod: string;
      paidAt: Date;
    }[];
    _count?: {
      appointments: number;
    };
  }[];
  _count?: {
    sessions: number;
    appointments: number;
  };
}

interface Note {
  id: string;
  note: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
}

interface SessionHistory {
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
  } | null;
  packagePurchase: {
    package: {
      name: string;
    };
  } | null;
}

export default function BabyProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;

  const [baby, setBaby] = useState<BabyWithRelations | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showAddParentDialog, setShowAddParentDialog] = useState(false);
  const [showSellPackageDialog, setShowSellPackageDialog] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [parentActionLoading, setParentActionLoading] = useState<string | null>(null);
  const [parentError, setParentError] = useState<string | null>(null);
  const [removeParentDialog, setRemoveParentDialog] = useState<{
    open: boolean;
    parentId: string;
    parentName: string;
    isPrimary: boolean;
  }>({ open: false, parentId: "", parentName: "", isPrimary: false });
  const [cancelPackageDialog, setCancelPackageDialog] = useState<{
    open: boolean;
    purchaseId: string;
    packageName: string;
  }>({ open: false, purchaseId: "", packageName: "" });
  const [isCancellingPackage, setIsCancellingPackage] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  // State for installment payment dialog
  const [paymentDialogPurchase, setPaymentDialogPurchase] = useState<BabyWithRelations["packagePurchases"][0] | null>(null);
  // State for bulk scheduling dialog
  const [bulkSchedulingPurchase, setBulkSchedulingPurchase] = useState<{
    id: string;
    remainingSessions: number;
    packageName: string;
    packageDuration: number;
    schedulePreferences: string | null;
  } | null>(null);

  const fetchBaby = useCallback(async () => {
    try {
      const response = await fetch(`/api/babies/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setBaby(data.baby);
    } catch (error) {
      console.error("Error fetching baby:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/babies/${id}/notes`);
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [id]);

  const fetchAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    try {
      const response = await fetch(`/api/appointments?babyId=${id}`);
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [id]);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`/api/babies/${id}/sessions`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBaby();
    fetchNotes();
    fetchAppointments();
    fetchSessions();
  }, [fetchBaby, fetchNotes, fetchAppointments, fetchSessions]);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/babies/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await fetch(`/api/babies/${id}/notes/${noteId}`, {
        method: "DELETE",
      });
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleSetAsPrimary = async (parentId: string) => {
    setParentActionLoading(parentId);
    setParentError(null);
    try {
      const response = await fetch(`/api/babies/${id}/parents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, isPrimary: true }),
      });

      if (response.ok) {
        fetchBaby();
      } else {
        const data = await response.json();
        setParentError(data.error);
      }
    } catch (error) {
      console.error("Error setting parent as primary:", error);
    } finally {
      setParentActionLoading(null);
    }
  };

  const openRemoveParentDialog = (parentId: string, parentName: string, isPrimary: boolean) => {
    // Check if this is the only parent
    if (!baby || baby.parents.length <= 1) {
      setParentError(t("babyProfile.info.cannotRemoveOnlyParent"));
      return;
    }

    // Check if trying to remove primary when there are other parents
    if (isPrimary && baby.parents.length > 1) {
      setParentError(t("babyProfile.info.cannotRemovePrimaryWithoutOther"));
      return;
    }

    // Open confirmation dialog
    setRemoveParentDialog({ open: true, parentId, parentName, isPrimary });
  };

  const handleConfirmRemoveParent = async () => {
    const { parentId } = removeParentDialog;
    setRemoveParentDialog({ open: false, parentId: "", parentName: "", isPrimary: false });

    setParentActionLoading(parentId);
    setParentError(null);
    try {
      const response = await fetch(`/api/babies/${id}/parents?parentId=${parentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBaby();
      } else {
        const data = await response.json();
        if (data.error === "CANNOT_REMOVE_ONLY_PARENT") {
          setParentError(t("babyProfile.info.cannotRemoveOnlyParent"));
        } else {
          setParentError(data.error);
        }
      }
    } catch (error) {
      console.error("Error removing parent:", error);
    } finally {
      setParentActionLoading(null);
    }
  };

  const handleCancelPackage = async () => {
    const { purchaseId } = cancelPackageDialog;
    setCancelPackageDialog({ open: false, purchaseId: "", packageName: "" });
    setIsCancellingPackage(true);

    try {
      const response = await fetch(`/api/package-purchases/${purchaseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBaby();
      } else {
        const data = await response.json();
        console.error("Error cancelling package:", data.error);
      }
    } catch (error) {
      console.error("Error cancelling package:", error);
    } finally {
      setIsCancellingPackage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!baby) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">{t("errors.notFound")}</p>
        <Link href={`/${locale}/admin/clients`} className="mt-4">
          <Button variant="outline">{t("common.back")}</Button>
        </Link>
      </div>
    );
  }

  const primaryParent = baby.parents.find((p) => p.isPrimary)?.parent ||
    baby.parents[0]?.parent;

  const activePackage = baby.packagePurchases.find(
    (p) => p.isActive && p.remainingSessions > 0
  );

  // Calculate total remaining sessions from ALL packages
  const totalRemainingSessions = baby.packagePurchases.reduce(
    (sum, pkg) => sum + (pkg.remainingSessions > 0 ? pkg.remainingSessions : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-xl hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
            {baby.name}
          </h1>
          <p className="text-sm text-gray-500">{formatAge(calculateExactAge(baby.birthDate), t)}</p>
        </div>
        <Link href={`/${locale}/admin/clients/${id}/edit`}>
          <Button
            variant="outline"
            className="h-10 rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            {t("babyProfile.actions.edit")}
          </Button>
        </Link>
      </div>

      {/* Quick Info Card */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Avatar */}
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
            <Baby className="h-10 w-10 text-teal-600" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                {formatAge(calculateExactAge(baby.birthDate), t)}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-teal-200 text-teal-700"
              >
                {baby.gender === "MALE"
                  ? t("babyForm.babyData.male")
                  : t("babyForm.babyData.female")}
              </Badge>
              {totalRemainingSessions > 0 ? (
                <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                  <Package className="mr-1 h-3 w-3" />
                  {totalRemainingSessions} {t("babyProfile.packages.sessionsRemaining")}
                </Badge>
              ) : (
                <Badge className="rounded-full bg-amber-100 text-amber-700">
                  {t("babyProfile.packages.noActivePackage")}
                </Badge>
              )}
            </div>

            {primaryParent && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4 text-gray-400" />
                  {primaryParent.name}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {primaryParent.phone}
                </span>
                {primaryParent.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {primaryParent.email}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {primaryParent && (
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${primaryParent.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-white/70 p-1 backdrop-blur-md">
          <TabsTrigger
            value="info"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            {t("babyProfile.tabs.info")}
          </TabsTrigger>
          <TabsTrigger
            value="packages"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            {t("babyProfile.tabs.packages")}
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            {t("babyProfile.tabs.appointments")}
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            {t("babyProfile.tabs.sessions")}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
          >
            {t("babyProfile.tabs.notes")}
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          {/* Basic Info */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
            <h3 className="mb-4 font-semibold text-gray-800">
              {t("babyProfile.info.basicInfo")}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">{t("babyProfile.info.birthDate")}</p>
                <p className="font-medium text-gray-800">
                  {new Date(baby.birthDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("babyProfile.info.gender")}</p>
                <p className="font-medium text-gray-800">
                  {baby.gender === "MALE"
                    ? t("babyForm.babyData.male")
                    : t("babyForm.babyData.female")}
                </p>
              </div>
              {baby.birthType && (
                <div>
                  <p className="text-sm text-gray-500">{t("babyProfile.info.birthType")}</p>
                  <p className="font-medium text-gray-800">
                    {baby.birthType === "NATURAL"
                      ? t("babyForm.babyData.natural")
                      : t("babyForm.babyData.cesarean")}
                  </p>
                </div>
              )}
              {baby.birthWeeks && (
                <div>
                  <p className="text-sm text-gray-500">
                    {t("babyProfile.info.gestationWeeks")}
                  </p>
                  <p className="font-medium text-gray-800">{baby.birthWeeks}</p>
                </div>
              )}
              {baby.birthWeight && (
                <div>
                  <p className="text-sm text-gray-500">{t("babyProfile.info.birthWeight")}</p>
                  <p className="font-medium text-gray-800">{baby.birthWeight} kg</p>
                </div>
              )}
            </div>

            {/* Special Observations */}
            {baby.specialObservations && (
              <div className="mt-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 p-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("babyForm.babyData.specialObservations")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{baby.specialObservations}</p>
              </div>
            )}
          </Card>

          {/* Medical Alerts - Critical Information */}
          {(baby.allergies || baby.diagnosedIllness || baby.birthDifficulty) && (
            <Card className="rounded-2xl border border-rose-200/70 bg-white/70 p-6 shadow-lg shadow-rose-500/10 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-amber-100">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-700">
                    {t("babyProfile.info.medicalAlerts")}
                  </h3>
                  <p className="text-xs text-rose-500/70">
                    {t("babyProfile.info.medicalAlertsDescription")}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {/* Allergies - Most Critical */}
                {baby.allergies && (
                  <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100/80">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-rose-600">
                        {t("babyProfile.info.alertAllergies")}
                      </p>
                      <p className="mt-1 text-sm text-rose-800">{baby.allergies}</p>
                    </div>
                  </div>
                )}

                {/* Diagnosed Illness */}
                {baby.diagnosedIllness && (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100/80">
                      <Stethoscope className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-600">
                        {t("babyProfile.info.alertDiagnosedIllness")}
                      </p>
                      {baby.diagnosedIllnessDesc && (
                        <p className="mt-1 text-sm text-amber-800">{baby.diagnosedIllnessDesc}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Birth Difficulty */}
                {baby.birthDifficulty && (
                  <div className="flex gap-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100/80">
                      <Heart className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-orange-600">
                        {t("babyProfile.info.alertBirthDifficulty")}
                      </p>
                      {baby.birthDifficultyDesc && (
                        <p className="mt-1 text-sm text-orange-800">{baby.birthDifficultyDesc}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Other Medical Info */}
          {(baby.pregnancyIssues || baby.priorStimulation ||
            baby.developmentDiagnosis || baby.recentMedication) && (
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100">
                  <Stethoscope className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  {t("babyForm.babyData.medicalInfo")}
                </h3>
              </div>
              <div className="space-y-3">
                {/* Pregnancy Issues */}
                {baby.pregnancyIssues && (
                  <div className="flex gap-3 rounded-xl border-l-4 border-teal-400 bg-gray-50/80 p-3 pl-4">
                    <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("babyForm.babyData.pregnancyIssues")}
                      </p>
                      {baby.pregnancyIssuesDesc && (
                        <p className="mt-1 text-sm text-gray-500">{baby.pregnancyIssuesDesc}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Prior Stimulation */}
                {baby.priorStimulation && (
                  <div className="flex gap-3 rounded-xl border-l-4 border-cyan-400 bg-gray-50/80 p-3 pl-4">
                    <Baby className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("babyForm.babyData.priorStimulation")}
                      </p>
                      {baby.priorStimulationType && (
                        <p className="mt-1 text-sm text-gray-500">{baby.priorStimulationType}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Development Diagnosis */}
                {baby.developmentDiagnosis && (
                  <div className="flex gap-3 rounded-xl border-l-4 border-teal-400 bg-gray-50/80 p-3 pl-4">
                    <ClipboardList className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("babyForm.babyData.developmentDiagnosis")}
                      </p>
                      {baby.developmentDiagnosisDesc && (
                        <p className="mt-1 text-sm text-gray-500">{baby.developmentDiagnosisDesc}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Medication */}
                {baby.recentMedication && (
                  <div className="flex gap-3 rounded-xl border-l-4 border-cyan-400 bg-gray-50/80 p-3 pl-4">
                    <Pill className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("babyForm.babyData.recentMedication")}
                      </p>
                      {baby.recentMedicationDesc && (
                        <p className="mt-1 text-sm text-gray-500">{baby.recentMedicationDesc}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Parents */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
            <h3 className="mb-4 font-semibold text-gray-800">
              {t("babyProfile.info.parents")}
            </h3>

            {/* Error message */}
            {parentError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {parentError}
              </div>
            )}

            <div className="space-y-4">
              {baby.parents.map(({ parent, relationship, isPrimary }) => (
                <div
                  key={parent.id}
                  className="flex flex-col gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                      <User className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{parent.name}</p>
                      <p className="text-sm text-gray-500">
                        {relationship === "MOTHER"
                          ? t("babyForm.parentForm.mother")
                          : relationship === "FATHER"
                            ? t("babyForm.parentForm.father")
                            : t("babyForm.parentForm.guardian")}
                        {isPrimary && (
                          <span className="ml-2 text-teal-600">
                            ({t("babyProfile.info.primaryContact")})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-sm text-gray-600 sm:text-right">
                      <p>{parent.phone}</p>
                      {parent.email && <p>{parent.email}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Set as Primary button - only show for non-primary parents */}
                      {!isPrimary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("babyProfile.info.setAsPrimary")}
                          onClick={() => handleSetAsPrimary(parent.id)}
                          disabled={parentActionLoading === parent.id}
                          className="h-8 w-8 rounded-lg hover:bg-amber-100"
                        >
                          {parentActionLoading === parent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                          ) : (
                            <Star className="h-4 w-4 text-amber-500" />
                          )}
                        </Button>
                      )}
                      {/* Edit button */}
                      <Link href={`/${locale}/admin/parents/${parent.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-teal-100"
                        >
                          <Edit className="h-4 w-4 text-teal-600" />
                        </Button>
                      </Link>
                      {/* Remove button - only show if more than 1 parent */}
                      {baby.parents.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("babyProfile.info.removeParent")}
                          onClick={() => openRemoveParentDialog(parent.id, parent.name, isPrimary)}
                          disabled={parentActionLoading === parent.id}
                          className="h-8 w-8 rounded-lg hover:bg-rose-100"
                        >
                          {parentActionLoading === parent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Parent Button */}
              <Button
                variant="outline"
                onClick={() => setShowAddParentDialog(true)}
                className="w-full rounded-xl border-2 border-dashed border-teal-300 text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("babyProfile.info.addParent")}
              </Button>
            </div>

            {/* Access Code */}
            {primaryParent && (
              <div className="mt-4 rounded-xl border-2 border-teal-200 bg-teal-50 p-4">
                <p className="text-sm text-teal-600">
                  {t("babyProfile.info.portalAccess")}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-xl font-bold text-teal-700">
                    {primaryParent.accessCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyCode(primaryParent.accessCode)}
                    className="h-8 w-8 rounded-lg hover:bg-teal-100"
                  >
                    {codeCopied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-teal-600" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          {/* Active Package Card */}
          {activePackage ? (
            <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">
                    {t("babyProfile.packages.activePackage")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-800">
                    {activePackage.package.name}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {activePackage.usedSessions} / {activePackage.totalSessions}{" "}
                    {t("common.sessionsUnit")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-600">
                    {activePackage.remainingSessions}
                  </p>
                  <p className="text-sm text-emerald-600">
                    {t("babyProfile.packages.sessionsRemaining")}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Package className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      {t("babyProfile.packages.noActivePackage")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("babyProfile.packages.sellPackageDescription")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSellPackageDialog(true)}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("babyProfile.packages.sellPackage")}
                </Button>
              </div>
            </Card>
          )}

          {/* Sell Package Button (when has active package) */}
          {activePackage && (
            <Button
              onClick={() => setShowSellPackageDialog(true)}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t("babyProfile.packages.sellPackage")}
            </Button>
          )}

          {/* Package History */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
            <h3 className="mb-4 font-semibold text-gray-800">
              {t("babyProfile.packages.history")}
            </h3>
            {baby.packagePurchases.length > 0 ? (
              <div className="space-y-3">
                {baby.packagePurchases.map((purchase) => (
                  <div key={purchase.id} className="space-y-3">
                    {/* Package Info Card */}
                    <div
                      className={`flex items-center justify-between rounded-xl border p-4 ${
                        purchase.isActive && purchase.remainingSessions > 0
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-gray-200 bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            purchase.isActive && purchase.remainingSessions > 0
                              ? "bg-emerald-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Package
                            className={`h-5 w-5 ${
                              purchase.isActive && purchase.remainingSessions > 0
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">
                              {purchase.package.name}
                            </p>
                            {purchase.schedulePreferences && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <CalendarClock className="h-3 w-3" />
                                {t("bulkScheduling.hasPreference")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {purchase.usedSessions} / {purchase.totalSessions}{" "}
                            {t("common.sessionsUnit")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Schedule Sessions button - show only when there are truly available sessions */}
                        {(() => {
                          const scheduledAppointments = purchase._count?.appointments || 0;
                          const availableToSchedule = purchase.remainingSessions - scheduledAppointments;
                          return availableToSchedule > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setBulkSchedulingPurchase({
                                  id: purchase.id,
                                  remainingSessions: availableToSchedule,
                                  packageName: purchase.package.name,
                                  packageDuration: purchase.package.duration,
                                  schedulePreferences: purchase.schedulePreferences,
                                })
                              }
                              className="h-8 rounded-lg text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                              title={t("bulkScheduling.scheduleSessions")}
                            >
                              <CalendarDays className="mr-1 h-4 w-4" />
                              {t("bulkScheduling.scheduleSessions")} ({availableToSchedule})
                            </Button>
                          ) : null;
                        })()}
                        {/* Cancel button - only show when no sessions have been used */}
                        {purchase.usedSessions === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCancelPackageDialog({
                                open: true,
                                purchaseId: purchase.id,
                                packageName: purchase.package.name,
                              })
                            }
                            disabled={isCancellingPackage}
                            className="h-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            title={t("babyProfile.packages.cancelPackage")}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            {t("babyProfile.packages.cancel")}
                          </Button>
                        )}
                        {purchase.isActive && purchase.remainingSessions > 0 ? (
                          <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                            {t("packages.active")}
                          </Badge>
                        ) : (
                          <Badge className="rounded-full bg-gray-100 text-gray-600">
                            {t("packages.completed")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Installments Card - Only show if purchase has installments > 1 */}
                    {purchase.installments > 1 && (
                      <PackageInstallmentsCard
                        purchase={purchase}
                        onRegisterPayment={() => setPaymentDialogPurchase(purchase)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {t("babyProfile.packages.noHistory")}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          {/* Schedule Button */}
          <Button
            onClick={() => setShowAppointmentDialog(true)}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t("babyProfile.appointments.scheduleNew")}
          </Button>

          {/* Appointments List */}
          {isLoadingAppointments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : appointments.length > 0 ? (
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
              <h3 className="mb-4 font-semibold text-gray-800">
                {t("babyProfile.appointments.upcomingAppointments")}
              </h3>
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      appointment.status === "SCHEDULED"
                        ? "border-teal-200 bg-teal-50/50"
                        : appointment.status === "CANCELLED"
                        ? "border-gray-200 bg-gray-50/50"
                        : "border-emerald-200 bg-emerald-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          appointment.status === "SCHEDULED"
                            ? "bg-teal-100"
                            : appointment.status === "CANCELLED"
                            ? "bg-gray-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        <Calendar
                          className={`h-5 w-5 ${
                            appointment.status === "SCHEDULED"
                              ? "text-teal-600"
                              : appointment.status === "CANCELLED"
                              ? "text-gray-400"
                              : "text-emerald-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(appointment.date).toLocaleDateString(
                            locale === "pt-BR" ? "pt-BR" : "es-ES",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            }
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`rounded-full ${
                        appointment.status === "SCHEDULED"
                          ? "bg-teal-100 text-teal-700"
                          : appointment.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-600"
                          : appointment.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : appointment.status === "NO_SHOW"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {t(`calendar.status.${appointment.status.toLowerCase()}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Calendar className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-600">
                  {t("babyProfile.appointments.noUpcoming")}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {t("babyProfile.appointments.scheduleDescription")}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : sessions.length > 0 ? (
            <>
              {/* Sessions summary */}
              <div className="flex items-center justify-between rounded-2xl border border-white/50 bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-teal-100">{t("babyProfile.sessions.completed")}</p>
                    <p className="text-2xl font-bold">{sessions.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-teal-100">{t("babyProfile.sessions.evaluated")}</p>
                    <p className="text-2xl font-bold">
                      {sessions.filter((s) => s.evaluation).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions list */}
              <div className="space-y-4">
                {sessions.map((session) => (
                  <SessionHistoryCard
                    key={session.id}
                    session={session}
                    locale={locale}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <FileText className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-600">
                  {t("babyProfile.sessions.noSessions")}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {t("babyProfile.sessions.noSessionsDescription")}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          {/* Add Note */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
            <Textarea
              placeholder={t("babyProfile.notes.notePlaceholder")}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
            />
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white"
              >
                {isAddingNote ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t("babyProfile.notes.addNote")}
              </Button>
            </div>
          </Card>

          {/* Notes List */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800">{note.note}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {t("babyProfile.notes.addedBy")} {note.user.name} •{" "}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <FileText className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-600">
                  {t("babyProfile.notes.noNotes")}
                </h3>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Parent Dialog */}
      {showAddParentDialog && baby && (
        <AddParentDialog
          babyId={baby.id}
          babyName={baby.name}
          existingParentIds={baby.parents.map((p) => p.parent.id)}
          onSuccess={() => {
            setShowAddParentDialog(false);
            fetchBaby();
          }}
          onClose={() => setShowAddParentDialog(false)}
        />
      )}

      {/* Sell Package Dialog */}
      {baby && (
        <SellPackageDialog
          open={showSellPackageDialog}
          onOpenChange={setShowSellPackageDialog}
          babyId={baby.id}
          babyName={baby.name}
          onSuccess={() => {
            fetchBaby();
          }}
        />
      )}

      {/* Schedule Appointment Dialog */}
      {baby && (
        <ScheduleAppointmentDialog
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          babyId={baby.id}
          babyName={baby.name}
          activePackage={activePackage ? {
            id: activePackage.id,
            remainingSessions: activePackage.remainingSessions,
            package: { name: activePackage.package.name },
          } : null}
          onSuccess={() => {
            fetchBaby();
            fetchAppointments();
          }}
        />
      )}

      {/* Remove Parent Confirmation Dialog */}
      <AlertDialog
        open={removeParentDialog.open}
        onOpenChange={(open) =>
          setRemoveParentDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("babyProfile.info.removeParent")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("babyProfile.info.confirmRemoveParent")}
              <span className="mt-2 block font-medium text-gray-800">
                {removeParentDialog.parentName}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogDestructiveAction onClick={handleConfirmRemoveParent}>
              {t("babyProfile.info.removeParent")}
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Package Confirmation Dialog */}
      <AlertDialog
        open={cancelPackageDialog.open}
        onOpenChange={(open) =>
          setCancelPackageDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("babyProfile.packages.cancelPackageTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("babyProfile.packages.confirmCancelPackage")}
              <span className="mt-2 block font-medium text-gray-800">
                {cancelPackageDialog.packageName}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogDestructiveAction onClick={handleCancelPackage}>
              {t("babyProfile.packages.cancelPackage")}
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Register Installment Payment Dialog */}
      {paymentDialogPurchase && (
        <RegisterInstallmentPaymentDialog
          open={!!paymentDialogPurchase}
          onOpenChange={(open) => !open && setPaymentDialogPurchase(null)}
          purchase={{
            ...paymentDialogPurchase,
            baby: { id: baby.id, name: baby.name },
          }}
          onSuccess={() => {
            fetchBaby();
            setPaymentDialogPurchase(null);
          }}
        />
      )}

      {/* Bulk Scheduling Dialog */}
      {baby && bulkSchedulingPurchase && (
        <BulkSchedulingDialog
          open={!!bulkSchedulingPurchase}
          onOpenChange={(open) => !open && setBulkSchedulingPurchase(null)}
          packagePurchaseId={bulkSchedulingPurchase.id}
          babyId={baby.id}
          babyName={baby.name}
          packageName={bulkSchedulingPurchase.packageName}
          packageDuration={bulkSchedulingPurchase.packageDuration}
          availableSessions={bulkSchedulingPurchase.remainingSessions}
          parentPreferences={
            bulkSchedulingPurchase.schedulePreferences
              ? JSON.parse(bulkSchedulingPurchase.schedulePreferences)
              : undefined
          }
          onComplete={() => {
            fetchBaby();
            fetchAppointments();
            setBulkSchedulingPurchase(null);
          }}
        />
      )}
    </div>
  );
}
