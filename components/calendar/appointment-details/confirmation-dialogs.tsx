"use client";

import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelReason: string;
  onCancelReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export function CancelDialog({
  open,
  onOpenChange,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
  isUpdating,
}: CancelDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("calendar.cancelAppointment")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("calendar.cancelConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Textarea
            value={cancelReason}
            onChange={(e) => onCancelReasonChange(e.target.value)}
            placeholder={t("calendar.cancelReasonPlaceholder")}
            className="min-h-[80px] rounded-xl border-2 border-gray-200"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogDestructiveAction
            onClick={onConfirm}
            disabled={!cancelReason.trim() || isUpdating}
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("calendar.confirmCancel")}
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface NoShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export function NoShowDialog({
  open,
  onOpenChange,
  onConfirm,
  isUpdating,
}: NoShowDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("calendar.markNoShow")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("calendar.noShowConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogDestructiveAction onClick={onConfirm} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("calendar.confirmNoShow")}
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
