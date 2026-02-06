"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Baby,
  User,
  Phone,
  MessageCircle,
  Loader2,
  ExternalLink,
  Info,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentData } from "./types";

interface ClientHeaderProps {
  appointment: AppointmentData;
  isParentAppointment: boolean;
  primaryParent: { id: string; name: string; phone: string } | null;
  isLoadingBaby: boolean;
  onViewBaby: () => void;
}

export function ClientHeader({
  appointment,
  isParentAppointment,
  primaryParent,
  isLoadingBaby,
  onViewBaby,
}: ClientHeaderProps) {
  const t = useTranslations();

  const clientName = isParentAppointment
    ? appointment.parent?.name
    : appointment.baby?.name;
  const clientPhone = isParentAppointment
    ? appointment.parent?.phone
    : primaryParent?.phone;
  const ClientIcon = isParentAppointment ? UserRound : Baby;

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-white p-4",
        isParentAppointment ? "border-rose-100" : "border-teal-100"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full shadow-md",
              isParentAppointment
                ? "bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-200"
                : "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-teal-200"
            )}
          >
            <ClientIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-800">{clientName}</p>
              {isParentAppointment && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                  {t("calendar.clientType.parent")}
                </span>
              )}
            </div>
            {/* For baby appointments, show primary parent */}
            {!isParentAppointment && primaryParent && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {primaryParent.name}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {primaryParent.phone}
                </span>
              </div>
            )}
            {/* For parent appointments, show phone */}
            {isParentAppointment && clientPhone && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {clientPhone}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* WhatsApp button */}
          {clientPhone && (
            <a
              href={`https://wa.me/${clientPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          {/* View baby details - only for baby appointments */}
          {!isParentAppointment && appointment.baby && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewBaby}
                disabled={isLoadingBaby}
                className="h-9 w-9 p-0 text-cyan-600 hover:bg-cyan-100"
              >
                {isLoadingBaby ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </Button>
              <Link href={`/admin/clients/${appointment.baby.id}`} target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-teal-600 hover:bg-teal-100"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
          {/* Link to parent profile for parent appointments */}
          {isParentAppointment && appointment.parent && (
            <Link href={`/admin/parents/${appointment.parent.id}`} target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-100"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
