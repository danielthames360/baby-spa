"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Play,
  Check,
  X,
  AlertCircle,
  CalendarClock,
  CreditCard,
} from "lucide-react";

interface AppointmentActionsProps {
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canMarkNoShow: boolean;
  canReschedule: boolean;
  canRegisterPayment: boolean;
  hasSessionId: boolean;
  isUpdating: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
  onReschedule: () => void;
  onRegisterPayment: () => void;
}

export function AppointmentActions({
  canStart,
  canComplete,
  canCancel,
  canMarkNoShow,
  canReschedule,
  canRegisterPayment,
  hasSessionId,
  isUpdating,
  onStart,
  onComplete,
  onCancel,
  onNoShow,
  onReschedule,
  onRegisterPayment,
}: AppointmentActionsProps) {
  const t = useTranslations();

  const hasActions =
    canStart ||
    canComplete ||
    canCancel ||
    canMarkNoShow ||
    canReschedule ||
    canRegisterPayment;

  if (!hasActions) return null;

  return (
    <div className="space-y-3">
      {/* Register Payment - for PENDING_PAYMENT appointments */}
      {canRegisterPayment && (
        <Button
          onClick={onRegisterPayment}
          disabled={isUpdating}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-6 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600"
        >
          <CreditCard className="mr-2 h-5 w-5" />
          {t("payment.registerPayment")}
        </Button>
      )}

      {/* Primary workflow action - Start or Complete */}
      {(canStart || canComplete) && (
        <div className="flex gap-2">
          {canStart && (
            <Button
              onClick={onStart}
              disabled={isUpdating}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Play className="mr-2 h-5 w-5" />
              )}
              {t("calendar.actions.start")}
            </Button>
          )}

          {canComplete && hasSessionId && (
            <Button
              onClick={onComplete}
              disabled={isUpdating}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-6 text-base font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Check className="mr-2 h-5 w-5" />
              )}
              {t("calendar.actions.complete")}
            </Button>
          )}
        </div>
      )}

      {/* Reschedule - neutral action */}
      {canReschedule && (
        <Button
          onClick={onReschedule}
          disabled={isUpdating}
          variant="outline"
          className="w-full rounded-xl border-2 border-teal-200 py-5 text-teal-700 hover:bg-teal-50"
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          {t("calendar.actions.reschedule")}
        </Button>
      )}

      {/* Negative actions - Cancel and No-Show */}
      {(canCancel || canMarkNoShow) && (
        <div className="flex gap-2 border-t border-gray-100 pt-2">
          {canCancel && (
            <Button
              onClick={onCancel}
              disabled={isUpdating}
              variant="ghost"
              className="flex-1 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="mr-2 h-4 w-4" />
              {t("calendar.actions.cancel")}
            </Button>
          )}

          {canMarkNoShow && (
            <Button
              onClick={onNoShow}
              disabled={isUpdating}
              variant="ghost"
              className="flex-1 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              {t("calendar.actions.noShow")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
