"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  CalendarClock,
  Clock,
  Phone,
  Package,
  X,
  CreditCard,
  QrCode,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGenderGradient } from "@/lib/utils/gender-utils";
import type { Appointment } from "./types";

// Constants moved outside component to prevent re-creation on each render
const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-orange-100 text-orange-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  NO_SHOW: "bg-rose-100 text-rose-700",
};

interface AppointmentCardProps {
  appointment: Appointment;
  formatDate: (date: string) => string;
  isPast?: boolean;
  onViewPaymentInstructions?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  formatDate,
  isPast,
  onViewPaymentInstructions,
  onCancel,
  onReschedule,
}: AppointmentCardProps) {
  const t = useTranslations();

  // Check if appointment can be modified (more than 24h before)
  const dateOnly = appointment.date.split("T")[0];
  const appointmentDateTime = new Date(`${dateOnly}T${appointment.startTime}:00`);
  const hoursUntil = Math.floor(
    (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  );
  const canModify =
    hoursUntil >= 24 &&
    (appointment.status === "SCHEDULED" || appointment.status === "PENDING_PAYMENT");
  const isLessThan24h = hoursUntil < 24 && hoursUntil > 0;

  const isPendingPayment = appointment.status === "PENDING_PAYMENT";
  const advanceAmount = appointment.selectedPackage?.advancePaymentAmount
    ? parseFloat(appointment.selectedPackage.advancePaymentAmount.toString())
    : null;

  // Determine if this is a parent appointment
  const isParentAppointment = !appointment.baby && !!appointment.parent;
  const clientName = appointment.baby?.name || appointment.parent?.name || "";

  const getStatusBadge = (status: string) => {
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.SCHEDULED
        )}
      >
        {t(`portal.appointments.status.${status}`)}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isPast
          ? "border-gray-100 bg-gray-50/50"
          : isPendingPayment
            ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50"
            : "border-teal-100 bg-gradient-to-r from-white to-teal-50/30 hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md",
            isPast
              ? "bg-gray-300"
              : isParentAppointment
                ? "bg-gradient-to-br from-rose-400 to-pink-500"
                : `bg-gradient-to-br ${getGenderGradient(appointment.baby?.gender || "OTHER")}`
          )}
        >
          {isParentAppointment ? (
            <UserRound className="h-6 w-6" />
          ) : (
            clientName.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-800">{clientName}</h3>
            {isParentAppointment && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                {t("calendar.clientType.parent")}
              </span>
            )}
            {getStatusBadge(appointment.status)}
            {/* Package badge */}
            {appointment.packagePurchase ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                <Package className="h-3 w-3" />
                {appointment.packagePurchase.package.name}
              </span>
            ) : appointment.selectedPackage ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Package className="h-3 w-3" />
                {appointment.selectedPackage.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                <Package className="h-3 w-3" />
                {t("portal.appointments.provisional")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(appointment.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {appointment.startTime}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Payment Info */}
      {isPendingPayment && (
        <div className="mt-3 border-t border-orange-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {t("payment.advanceRequired")}:{" "}
                <span className="font-bold">Bs. {advanceAmount}</span>
              </span>
            </div>
            <button
              onClick={() => onViewPaymentInstructions?.(appointment)}
              className="flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
            >
              <QrCode className="h-3.5 w-3.5" />
              {t("payment.viewPaymentInstructions")}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons (Cancel/Reschedule) - Only for upcoming, non-past appointments */}
      {!isPast &&
        (appointment.status === "SCHEDULED" ||
          appointment.status === "PENDING_PAYMENT") && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            {canModify ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onReschedule?.(appointment)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  {t("portal.appointments.rescheduleAppointment")}
                </button>
                <button
                  onClick={() => onCancel?.(appointment)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("portal.appointments.cancelAppointment")}
                </button>
              </div>
            ) : isLessThan24h ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t("portal.appointments.lessThan24h")}
                  </span>
                </div>
                <button
                  onClick={() => onCancel?.(appointment)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {t("portal.appointments.contactForChanges")}
                </button>
              </div>
            ) : null}
          </div>
        )}
    </div>
  );
}
