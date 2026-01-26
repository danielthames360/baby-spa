"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Baby,
  UserRound,
  Phone,
  MoreVertical,
  Trash2,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Banknote,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

// bundle-dynamic-imports: Lazy load dialogs
const RegisterPaymentDialog = dynamic(
  () => import("./register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);
const ProductSaleDialog = dynamic(
  () => import("./product-sale-dialog").then((m) => m.ProductSaleDialog),
  { ssr: false }
);
const ParticipantPurchasesDialog = dynamic(
  () => import("./participant-purchases-dialog").then((m) => m.ParticipantPurchasesDialog),
  { ssr: false }
);

// Status badge styles
const PARTICIPANT_STATUS_STYLES: Record<string, string> = {
  REGISTERED: "border-blue-200 bg-blue-50 text-blue-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-gray-200 bg-gray-50 text-gray-500",
  NO_SHOW: "border-rose-200 bg-rose-50 text-rose-600",
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
      parent: {
        name: string;
        phone: string | null;
      };
    }[];
  } | null;
  parent?: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
  } | null;
}

interface ParticipantListProps {
  eventId: string;
  participants: Participant[];
  eventType: "BABIES" | "PARENTS";
  eventStatus: string;
  onRefresh?: () => void;
}

export function ParticipantList({
  eventId,
  participants,
  eventType,
  eventStatus,
  onRefresh,
}: ParticipantListProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    participantId: string;
    participantName: string;
    amountDue: number;
    amountPaid: number;
  } | null>(null);
  const [saleDialog, setSaleDialog] = useState<{
    open: boolean;
    participantId: string;
    participantName: string;
    babyId?: string;
  } | null>(null);
  const [purchasesDialog, setPurchasesDialog] = useState<{
    open: boolean;
    participantId: string;
    participantName: string;
  } | null>(null);
  const [participantsWithPurchases, setParticipantsWithPurchases] = useState<Set<string>>(new Set());

  const canModify = ["DRAFT", "PUBLISHED"].includes(eventStatus);
  const canSellProducts = eventStatus === "IN_PROGRESS";
  const canViewPurchases = ["IN_PROGRESS", "COMPLETED"].includes(eventStatus);
  const canRegisterPayment = ["DRAFT", "PUBLISHED", "IN_PROGRESS"].includes(eventStatus);

  // Fetch which participants have purchases
  const fetchPurchaseStatus = async () => {
    if (!canViewPurchases) return;
    try {
      const response = await fetch(`/api/events/${eventId}/participants-with-purchases`);
      if (response.ok) {
        const data = await response.json();
        setParticipantsWithPurchases(new Set(data.participantIds || []));
      }
    } catch (error) {
      console.error("Error fetching purchase status:", error);
    }
  };

  useEffect(() => {
    fetchPurchaseStatus();
  }, [eventId, canViewPurchases]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/participants/${deleteId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete");
      toast.success(t("messages.participantRemoved"));
      onRefresh?.();
      router.refresh();
    } catch (error) {
      toast.error("Error removing participant");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleMarkAttendance = async (participantId: string, attended: boolean) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/participants/${participantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attended }),
        }
      );
      if (!response.ok) throw new Error("Failed to update");
      toast.success(t("messages.attendanceSaved"));
      onRefresh?.();
      router.refresh();
    } catch (error) {
      toast.error("Error updating attendance");
    }
  };

  if (participants.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          {eventType === "BABIES" ? (
            <Baby className="h-6 w-6 text-gray-400" />
          ) : (
            <UserRound className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <p className="text-sm text-gray-500">{t("participants.noParticipants")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {participants.map((participant) => {
          const name = participant.baby?.name || participant.parent?.name || "—";
          const primaryParent = participant.baby?.parents.find((p) => p.isPrimary)?.parent;
          const phone = primaryParent?.phone || participant.parent?.phone;
          const amountDue = Number(participant.amountDue);
          const amountPaid = Number(participant.amountPaid);
          const isPaid = amountPaid >= amountDue;
          const isFree = participant.discountType === "COURTESY";

          return (
            <div
              key={participant.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              {/* Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100">
                  {eventType === "BABIES" ? (
                    <Baby className="h-5 w-5 text-teal-600" />
                  ) : (
                    <UserRound className="h-5 w-5 text-cyan-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{name}</p>
                  {phone && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      {phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Status & Payment */}
              <div className="flex items-center gap-2">
                {/* Attendance indicator */}
                {participant.attended === true && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                {participant.attended === false && (
                  <XCircle className="h-5 w-5 text-rose-500" />
                )}

                {/* Payment */}
                {isFree ? (
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                    {t("payment.free")}
                  </Badge>
                ) : isPaid ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Bs. {amountPaid.toFixed(0)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Bs. {amountPaid.toFixed(0)}/{amountDue.toFixed(0)}
                  </Badge>
                )}

                {/* Status */}
                <Badge
                  variant="outline"
                  className={`${PARTICIPANT_STATUS_STYLES[participant.status] || PARTICIPANT_STATUS_STYLES.REGISTERED}`}
                >
                  {t(`participants.statuses.${participant.status}`)}
                </Badge>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Register Payment option */}
                    {canRegisterPayment && !isFree && !isPaid && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setPaymentDialog({
                            open: true,
                            participantId: participant.id,
                            participantName: name,
                            amountDue,
                            amountPaid,
                          })}
                        >
                          <Banknote className="mr-2 h-4 w-4 text-emerald-500" />
                          {t("payment.registerPayment")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {/* Sell products option - for events in progress */}
                    {canSellProducts && (
                      <DropdownMenuItem
                        onClick={() => setSaleDialog({
                          open: true,
                          participantId: participant.id,
                          participantName: name,
                          babyId: participant.baby?.id,
                        })}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4 text-purple-500" />
                        {t("sales.sellProduct")}
                      </DropdownMenuItem>
                    )}
                    {/* View purchases option - only if participant has purchases */}
                    {canViewPurchases && participantsWithPurchases.has(participant.id) && (
                      <DropdownMenuItem
                        onClick={() => setPurchasesDialog({
                          open: true,
                          participantId: participant.id,
                          participantName: name,
                        })}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4 text-indigo-500" />
                        {t("sales.viewPurchases")}
                      </DropdownMenuItem>
                    )}
                    {(canSellProducts || (canViewPurchases && participantsWithPurchases.has(participant.id))) && (
                      <DropdownMenuSeparator />
                    )}
                    {/* Attendance options - show when event is in progress */}
                    {eventStatus === "IN_PROGRESS" && (
                      <>
                        {participant.attended !== true && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAttendance(participant.id, true)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                            {t("attendance.attended")}
                          </DropdownMenuItem>
                        )}
                        {participant.attended !== false && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAttendance(participant.id, false)}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                            {t("attendance.notAttended")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {canModify && (
                      <DropdownMenuItem
                        className="text-rose-600"
                        onClick={() => setDeleteId(participant.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("participants.remove")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("participants.confirmRemove")}</AlertDialogTitle>
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
              {isDeleting ? "..." : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Register Payment dialog */}
      {paymentDialog && (
        <RegisterPaymentDialog
          open={paymentDialog.open}
          onOpenChange={(open) => !open && setPaymentDialog(null)}
          eventId={eventId}
          participantId={paymentDialog.participantId}
          participantName={paymentDialog.participantName}
          amountDue={paymentDialog.amountDue}
          amountPaid={paymentDialog.amountPaid}
          onSuccess={() => {
            onRefresh?.();
            router.refresh();
          }}
        />
      )}

      {/* Product Sale dialog */}
      {saleDialog && (
        <ProductSaleDialog
          open={saleDialog.open}
          onOpenChange={(open) => !open && setSaleDialog(null)}
          eventId={eventId}
          participantId={saleDialog.participantId}
          participantName={saleDialog.participantName}
          babyId={saleDialog.babyId}
          onSuccess={() => {
            onRefresh?.();
            fetchPurchaseStatus();
            router.refresh();
          }}
        />
      )}

      {/* Purchases dialog */}
      {purchasesDialog && (
        <ParticipantPurchasesDialog
          open={purchasesDialog.open}
          onOpenChange={(open) => !open && setPurchasesDialog(null)}
          eventId={eventId}
          participantId={purchasesDialog.participantId}
          participantName={purchasesDialog.participantName}
        />
      )}
    </>
  );
}
