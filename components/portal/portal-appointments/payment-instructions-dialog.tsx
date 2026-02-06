"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Download, Loader2 } from "lucide-react";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { useMobileViewport } from "./use-mobile-viewport";
import type { Appointment, PaymentSettings } from "./types";

interface PaymentInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  paymentSettings: PaymentSettings | null;
  loading: boolean;
  onDownloadQr: () => void;
}

export function PaymentInstructionsDialog({
  open,
  onOpenChange,
  appointment,
  paymentSettings,
  loading,
  onDownloadQr,
}: PaymentInstructionsDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { height, isMobile } = useMobileViewport();

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, locale === "pt-BR" ? "pt-BR" : "es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getWhatsAppUrl = () => {
    if (!paymentSettings?.whatsappNumber || !appointment) return "";

    const countryCode = (paymentSettings.whatsappCountryCode || "+591").replace("+", "");
    const phone = countryCode + paymentSettings.whatsappNumber.replace(/\D/g, "");

    const advanceAmount = appointment.selectedPackage?.advancePaymentAmount
      ? parseFloat(appointment.selectedPackage.advancePaymentAmount.toString())
      : 0;

    let message = paymentSettings.whatsappMessage || "";
    message = message
      .replace("{fecha}", formatDateForDisplay(appointment.date, locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }))
      .replace("{hora}", appointment.startTime)
      .replace("{bebe}", appointment.baby?.name || appointment.parent?.name || "")
      .replace("{monto}", advanceAmount.toString());

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const advanceAmount = appointment?.selectedPackage?.advancePaymentAmount
    ? parseFloat(appointment.selectedPackage.advancePaymentAmount.toString())
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 bg-white/95 p-0 backdrop-blur-md sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-white/50"
        style={height && isMobile ? { height, maxHeight: height } : undefined}
      >
        {/* Header - Fixed */}
        <div className="shrink-0 border-b border-gray-100 px-6 py-4 sm:rounded-t-2xl">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <CreditCard className="h-5 w-5 text-orange-600" />
              {t("payment.required")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {appointment?.selectedPackage?.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-gray-500">{t("payment.advanceRequired")}</p>
                <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-orange-50 px-6 py-3 text-xl font-bold text-orange-700">
                  <span>Bs.</span>
                  <span>{advanceAmount}</span>
                </div>
              </div>

              {/* QR Code */}
              {paymentSettings?.paymentQrImage && (
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-gray-600">
                    {t("payment.scanQr")}
                  </p>
                  <div className="mx-auto h-44 w-44 rounded-xl border-2 border-teal-200 bg-white p-2 shadow-lg">
                    <img
                      src={paymentSettings.paymentQrImage}
                      alt="QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <button
                    onClick={onDownloadQr}
                    className="mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-50"
                  >
                    <Download className="h-4 w-4" />
                    {t("payment.downloadQr")}
                  </button>
                </div>
              )}

              {/* WhatsApp Button */}
              {paymentSettings?.whatsappNumber && (
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {t("payment.sendWhatsapp")}
                </a>
              )}

              {/* Appointment Summary */}
              {appointment && (
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {appointment.baby ? t("common.baby") : t("common.client")}:
                    </span>
                    <span className="font-medium text-gray-800">
                      {appointment.baby?.name || appointment.parent?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("common.date")}:</span>
                    <span className="font-medium text-gray-800">
                      {formatDate(appointment.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("common.time")}:</span>
                    <span className="font-medium text-gray-800">
                      {appointment.startTime}
                    </span>
                  </div>
                </div>
              )}

              {/* Info message */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    {t("payment.confirmationPending")}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 sm:rounded-b-2xl">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200"
          >
            {t("payment.understood")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
