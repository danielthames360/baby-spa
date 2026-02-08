"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency-utils";
import { Clock, CreditCard, Download, Loader2 } from "lucide-react";
import type { PaymentSettings, ClientType } from "../types";

interface PaymentStepProps {
  advanceAmount: number | null;
  selectedPackageName: string;
  paymentSettings: PaymentSettings | null;
  loadingPaymentSettings: boolean;
  selectedDate: Date | null;
  selectedTime: string;
  clientType: ClientType | null;
  clientName: string;
  onDownloadQr: () => void;
  getWhatsAppUrl: () => string;
}

export function PaymentStep({
  advanceAmount,
  selectedPackageName,
  paymentSettings,
  loadingPaymentSettings,
  selectedDate,
  selectedTime,
  clientType,
  clientName,
  onDownloadQr,
  getWhatsAppUrl,
}: PaymentStepProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";

  if (loadingPaymentSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Payment header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-100">
          <CreditCard className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-800">
          {t("payment.required")}
        </h3>
        <p className="mt-2 text-sm text-gray-500">{selectedPackageName}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-6 py-3 text-lg font-bold text-amber-700">
          <span>{formatCurrency(advanceAmount || 0, locale)}</span>
        </div>
      </div>

      {/* QR Code */}
      {paymentSettings?.paymentQrImage && (
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-gray-600">
            {t("payment.scanQr")}
          </p>
          <div className="mx-auto h-48 w-48 rounded-xl border-2 border-teal-200 bg-white p-2 shadow-lg">
            <Image
              src={paymentSettings.paymentQrImage}
              alt="QR Code"
              width={192}
              height={192}
              className="h-full w-full object-contain"
            />
          </div>
          {/* Download QR Button */}
          <button
            onClick={onDownloadQr}
            className="mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:border-teal-300 hover:bg-teal-50"
          >
            <Download className="h-4 w-4" />
            {t("payment.downloadQr")}
          </button>
        </div>
      )}

      {/* WhatsApp Button */}
      {paymentSettings?.whatsappNumber && (
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-gray-600">
            {t("payment.sendWhatsapp")}
          </p>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t("payment.sendWhatsapp")}
          </a>
        </div>
      )}

      {/* Confirmation pending message */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {t("payment.confirmationPending")}
            </p>
          </div>
        </div>
      </div>

      {/* Appointment summary */}
      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {clientType === "self" ? t("common.client") : t("common.baby")}:
          </span>
          <span className="font-medium text-gray-800">{clientName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.date")}:</span>
          <span className="font-medium text-gray-800">
            {selectedDate?.toLocaleDateString(dateLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.time")}:</span>
          <span className="font-medium text-gray-800">{selectedTime}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("common.package")}:</span>
          <span className="font-medium text-gray-800">
            {selectedPackageName}
          </span>
        </div>
      </div>
    </div>
  );
}
