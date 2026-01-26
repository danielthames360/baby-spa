"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  UserPlus,
  Loader2,
  Trash2,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ParticipantList } from "./participant-list";
import { toast } from "sonner";
import { formatDateForDisplay } from "@/lib/utils/date-utils";

// bundle-dynamic-imports: Lazy load heavy dialog components
const AddParticipantDialog = dynamic(
  () => import("./add-participant-dialog").then((m) => m.AddParticipantDialog),
  { ssr: false }
);
const AddParentLeadDialog = dynamic(
  () => import("./add-parent-lead-dialog").then((m) => m.AddParentLeadDialog),
  { ssr: false }
);
const EventProductsSection = dynamic(
  () => import("./event-products-section").then((m) => m.EventProductsSection),
  { ssr: false }
);

// Status badge styles
const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-gray-200 bg-gray-50 text-gray-600",
  PUBLISHED: "border-teal-200 bg-teal-50 text-teal-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-600",
};

interface Participant {
  id: string;
  status: string;
  amountDue: number | { toString(): string };
  amountPaid: number | { toString(): string };
  attended: boolean | null;
  discountType: string | null;
  baby?: {
    id: string;
    name: string;
    parents: {
      isPrimary: boolean;
      parent: { name: string; phone: string | null };
    }[];
  } | null;
  parent?: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
  } | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  type: "BABIES" | "PARENTS";
  date: Date | string;
  startTime: string;
  endTime: string;
  status: string;
  maxParticipants: number;
  blockedTherapists: number;
  basePrice: number | { toString(): string };
  internalNotes: string | null;
  externalNotes: string | null;
  participants: Participant[];
  createdBy: { id: string; name: string };
}

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const basePrice = Number(event.basePrice);

  // js-combine-iterations: Single iteration to compute all participant stats
  const { activeParticipants, totalExpected, totalPaid, attendedCount } = useMemo(() => {
    let expected = 0;
    let paid = 0;
    let attended = 0;
    const active = event.participants.filter((p) => {
      if (p.status === "CANCELLED") return false;
      expected += Number(p.amountDue);
      paid += Number(p.amountPaid);
      if (p.attended === true) attended++;
      return true;
    });
    return { activeParticipants: active, totalExpected: expected, totalPaid: paid, attendedCount: attended };
  }, [event.participants]);

  const dateFormatted = formatDateForDisplay(
    event.date,
    locale === "pt-BR" ? "pt-BR" : "es-ES",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  const canEdit = ["DRAFT", "PUBLISHED"].includes(event.status);
  const canPublish = event.status === "DRAFT";
  const canStart = event.status === "PUBLISHED";
  const canComplete = event.status === "IN_PROGRESS";
  const canCancel = ["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(event.status);
  const canDelete = event.status === "DRAFT";
  const canAddParticipants = ["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(event.status);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/events/${event.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error updating status");
      }

      const messageKey = newStatus === "PUBLISHED" ? "published"
        : newStatus === "IN_PROGRESS" ? "started"
        : newStatus === "COMPLETED" ? "completed"
        : "cancelled";
      toast.success(t(`messages.${messageKey}`));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsUpdatingStatus(false);
      setStatusDialog(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error deleting event");
      }

      toast.success(t("messages.deleted"));
      router.push(`/${locale}/admin/events`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent sm:text-3xl">
              {event.name}
            </h1>
            <Badge
              variant="outline"
              className={`${STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT}`}
            >
              {t(event.status.toLowerCase())}
            </Badge>
          </div>
          <p className="mt-1 text-gray-500">
            {t(`typeLabels.${event.type}`)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/admin/events/${event.id}/edit`)}
              className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              <Edit className="mr-2 h-4 w-4" />
              {tCommon("edit")}
            </Button>
          )}
          {canPublish && (
            <Button
              onClick={() => setStatusDialog("PUBLISHED")}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
            >
              {t("form.publish")}
            </Button>
          )}
          {canStart && (
            <Button
              onClick={() => setStatusDialog("IN_PROGRESS")}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/50"
            >
              <Play className="mr-2 h-4 w-4" />
              {t("form.startEvent")}
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={() => setStatusDialog("COMPLETED")}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-300/50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("form.completeEvent")}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setStatusDialog("CANCELLED")}
              className="rounded-xl border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t("form.cancelEvent")}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(true)}
              className="rounded-xl border-2 border-rose-300 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon("delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("form.date")}</p>
                <p className="font-medium text-gray-800">{dateFormatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{tCommon("time")}</p>
                <p className="font-medium text-gray-800">{event.startTime} - {event.endTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("participants.title")}</p>
                <p className="font-medium text-gray-800">
                  {activeParticipants.length}/{event.maxParticipants}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("summary.totalCollected")}</p>
                <p className="font-medium text-gray-800">
                  Bs. {totalPaid.toFixed(0)} / {totalExpected.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Therapists info card */}
        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                event.blockedTherapists === 4
                  ? "bg-gradient-to-br from-rose-100 to-pink-100"
                  : event.blockedTherapists > 0
                    ? "bg-gradient-to-br from-amber-100 to-orange-100"
                    : "bg-gradient-to-br from-gray-100 to-slate-100"
              }`}>
                <UserCog className={`h-5 w-5 ${
                  event.blockedTherapists === 4
                    ? "text-rose-600"
                    : event.blockedTherapists > 0
                      ? "text-amber-600"
                      : "text-gray-500"
                }`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("form.blockedTherapists")}</p>
                <p className={`font-medium ${
                  event.blockedTherapists === 4
                    ? "text-rose-600"
                    : event.blockedTherapists > 0
                      ? "text-amber-600"
                      : "text-gray-800"
                }`}>
                  {event.blockedTherapists === 4
                    ? t("form.allTherapists")
                    : event.blockedTherapists === 0
                      ? t("form.noBlockedTherapists")
                      : `${event.blockedTherapists} / 4`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description & Notes */}
      {(event.description || event.externalNotes || event.internalNotes) && (
        <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <CardContent className="space-y-3 p-4">
            {event.description && (
              <div>
                <p className="text-xs font-medium text-gray-500">{t("form.description")}</p>
                <p className="text-gray-700">{event.description}</p>
              </div>
            )}
            {event.externalNotes && (
              <div>
                <p className="text-xs font-medium text-gray-500">{t("form.externalNotes")}</p>
                <p className="text-gray-700">{event.externalNotes}</p>
              </div>
            )}
            {event.internalNotes && (
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-600">{t("form.internalNotes")}</p>
                <p className="text-amber-800">{event.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {t("participants.title")} ({activeParticipants.length})
          </CardTitle>
          {canAddParticipants && (
            <Button
              size="sm"
              onClick={() => setIsAddParticipantOpen(true)}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {tCommon("add")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <ParticipantList
            eventId={event.id}
            participants={event.participants}
            eventType={event.type}
            eventStatus={event.status}
          />
        </CardContent>
      </Card>

      {/* Products Used Section - only show when event is in progress or completed */}
      {["IN_PROGRESS", "COMPLETED"].includes(event.status) && (
        <EventProductsSection
          eventId={event.id}
          eventStatus={event.status}
        />
      )}

      {/* Add Participant Dialog */}
      {event.type === "BABIES" ? (
        <AddParticipantDialog
          open={isAddParticipantOpen}
          onOpenChange={setIsAddParticipantOpen}
          eventId={event.id}
          basePrice={basePrice}
        />
      ) : (
        <AddParentLeadDialog
          open={isAddParticipantOpen}
          onOpenChange={setIsAddParticipantOpen}
          eventId={event.id}
          basePrice={basePrice}
        />
      )}

      {/* Status Change Dialog */}
      <AlertDialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog === "PUBLISHED" && t("form.publish")}
              {statusDialog === "IN_PROGRESS" && t("form.startEvent")}
              {statusDialog === "COMPLETED" && t("confirmations.complete")}
              {statusDialog === "CANCELLED" && t("confirmations.cancel")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog === "COMPLETED" && t("confirmations.completeDescription")}
              {statusDialog === "CANCELLED" && t("confirmations.cancelDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => statusDialog && handleStatusChange(statusDialog)}
              disabled={isUpdatingStatus}
              className={statusDialog === "CANCELLED" ? "bg-rose-500 hover:bg-rose-600" : ""}
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmations.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmations.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
