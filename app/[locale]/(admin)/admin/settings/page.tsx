"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Settings,
  CreditCard,
  Upload,
  Phone,
  MessageSquare,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ImageIcon,
  Bell,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SystemSettings {
  paymentQrImage: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
  whatsappMessage: string | null;
  notificationPollingInterval: number;
  notificationExpirationDays: number;
  defaultPackage?: {
    id: string;
    name: string;
    sessionCount: number;
    duration: number;
  } | null;
}

export default function SettingsPage() {
  const t = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = session?.user?.role === "OWNER";

  // Redirect non-OWNER users
  useEffect(() => {
    if (status === "authenticated" && !isOwner) {
      router.replace("/admin/dashboard");
    }
  }, [status, isOwner, router]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state - Payment
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+591");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Hola, adjunto mi comprobante de pago para la cita del {fecha} a las {hora}. Bebé: {bebe}"
  );

  // Form state - Notifications (only for ADMIN)
  const [pollingInterval, setPollingInterval] = useState(5);
  const [expirationDays, setExpirationDays] = useState(7);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings as SystemSettings;

        if (settings.paymentQrImage) {
          setQrImage(settings.paymentQrImage);
          setQrPreview(settings.paymentQrImage);
        }
        if (settings.whatsappCountryCode) {
          setWhatsappCountryCode(settings.whatsappCountryCode);
        }
        if (settings.whatsappNumber) {
          setWhatsappNumber(settings.whatsappNumber);
        }
        if (settings.whatsappMessage) {
          setWhatsappMessage(settings.whatsappMessage);
        }
        // Notification settings
        if (settings.notificationPollingInterval) {
          setPollingInterval(settings.notificationPollingInterval);
        }
        if (settings.notificationExpirationDays) {
          setExpirationDays(settings.notificationExpirationDays);
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError(t("settings.payment.invalidFormat"));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t("settings.payment.fileTooLarge"));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQrImage(base64);
      setQrPreview(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrImage(null);
    setQrPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentQrImage: qrImage,
          whatsappCountryCode,
          whatsappNumber,
          whatsappMessage,
          // Only include notification settings if user is ADMIN
          ...(isOwner && {
            notificationPollingInterval: pollingInterval,
            notificationExpirationDays: expirationDays,
          }),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        if (data.error === "QR_IMAGE_TOO_LARGE") {
          setError(t("settings.payment.fileTooLarge"));
        } else if (data.error === "INVALID_WHATSAPP_NUMBER") {
          setError(t("settings.payment.invalidPhone"));
        } else if (data.error === "INVALID_POLLING_INTERVAL") {
          setError(t("settings.notifications.invalidPollingInterval"));
        } else if (data.error === "INVALID_EXPIRATION_DAYS") {
          setError(t("settings.notifications.invalidExpirationDays"));
        } else {
          setError("Error saving settings");
        }
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("settings.payment.title")}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{t("settings.payment.saved")}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-rose-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Payment Configuration Card */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="mb-6 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            {t("settings.payment.title")}
          </h2>
        </div>

        <div className="space-y-6">
          {/* QR Code Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              {t("settings.payment.qrImage")}
            </Label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* QR Preview */}
              <div
                className={cn(
                  "relative flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                  qrPreview
                    ? "border-teal-300 bg-white"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                {qrPreview ? (
                  <>
                    <Image
                      src={qrPreview}
                      alt="QR Code"
                      fill
                      className="object-contain p-2"
                    />
                    <button
                      onClick={handleRemoveQr}
                      className="absolute right-2 top-2 rounded-full bg-rose-500 p-1 text-white shadow-md transition-transform hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-sm">QR Code</p>
                  </div>
                )}
              </div>

              {/* Upload Button and Info */}
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 rounded-xl border-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  <Upload className="h-4 w-4" />
                  {t("settings.payment.uploadQr")}
                </Button>
                <p className="text-xs text-gray-500">
                  {t("settings.payment.qrFormats")}
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              {t("settings.payment.whatsappNumber")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={whatsappCountryCode}
                onChange={(e) => setWhatsappCountryCode(e.target.value)}
                className="w-24 rounded-xl border-2 border-teal-100 text-center focus:border-teal-400"
                placeholder="+591"
              />
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                className="flex-1 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                placeholder={t("settings.payment.whatsappPlaceholder")}
              />
            </div>
          </div>

          {/* Message Template */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              {t("settings.payment.messageTemplate")}
            </Label>
            <Textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="min-h-[100px] rounded-xl border-2 border-teal-100 focus:border-teal-400"
              placeholder={t("settings.payment.messageTemplate")}
            />
            <p className="text-xs text-gray-500">
              {t("settings.payment.messageVariables")}
            </p>
          </div>

        </div>
      </div>

      {/* Notification Configuration Card - Only for ADMIN */}
      {isOwner && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {t("settings.notifications.title")}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Polling Interval */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                {t("settings.notifications.pollingInterval")}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={pollingInterval}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setPollingInterval(Math.min(30, Math.max(1, value)));
                  }}
                  className="w-24 rounded-xl border-2 border-teal-100 text-center focus:border-teal-400"
                />
                <span className="text-sm text-gray-500">
                  {t("settings.notifications.minutes")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("settings.notifications.pollingIntervalHelp")}
              </p>
            </div>

            {/* Expiration Days */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                {t("settings.notifications.expirationDays")}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={expirationDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setExpirationDays(Math.min(30, Math.max(1, value)));
                  }}
                  className="w-24 rounded-xl border-2 border-teal-100 text-center focus:border-teal-400"
                />
                <span className="text-sm text-gray-500">
                  {t("settings.notifications.days")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("settings.notifications.expirationDaysHelp")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {t("settings.payment.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
