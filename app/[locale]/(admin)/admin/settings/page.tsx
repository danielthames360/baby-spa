"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  CreditCard,
  Upload,
  Phone,
  MessageSquare,
  Save,
  Loader2,
  X,
  ImageIcon,
  Bell,
  Clock,
  Calendar,
  CheckCircle,
  Instagram,
  MapPin,
  CalendarClock,
  Users,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SystemSettings {
  paymentQrImage: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
  whatsappMessage: string | null;
  instagramHandle: string | null;
  businessAddress: string | null;
  notificationPollingInterval: number;
  notificationExpirationDays: number;
  maxSlotsStaff: number;
  maxSlotsPortal: number;
  defaultPackage?: {
    id: string;
    name: string;
    sessionCount: number;
    duration: number;
  } | null;
}

export default function SettingsPage() {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state - Payment
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+591");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Hola, adjunto mi comprobante de pago para la cita del {fecha} a las {hora}. Bebé: {bebe}"
  );
  const [instagramHandle, setInstagramHandle] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Form state - Notifications
  const [pollingInterval, setPollingInterval] = useState(5);
  const [expirationDays, setExpirationDays] = useState(7);

  // Form state - Slots
  const [maxSlotsStaff, setMaxSlotsStaff] = useState(5);
  const [maxSlotsPortal, setMaxSlotsPortal] = useState(2);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional mount-only fetch
  }, []);

  // Detect changes
  useEffect(() => {
    const currentValues = {
      qrImage,
      whatsappCountryCode,
      whatsappNumber,
      whatsappMessage,
      instagramHandle,
      businessAddress,
      pollingInterval,
      expirationDays,
      maxSlotsStaff,
      maxSlotsPortal,
    };
    const changed = JSON.stringify(currentValues) !== JSON.stringify(originalValues);
    setHasChanges(changed);
  }, [qrImage, whatsappCountryCode, whatsappNumber, whatsappMessage, instagramHandle, businessAddress, pollingInterval, expirationDays, maxSlotsStaff, maxSlotsPortal, originalValues]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings as SystemSettings;

        const values = {
          qrImage: settings.paymentQrImage || null,
          whatsappCountryCode: settings.whatsappCountryCode || "+591",
          whatsappNumber: settings.whatsappNumber || "",
          whatsappMessage: settings.whatsappMessage || "Hola, adjunto mi comprobante de pago para la cita del {fecha} a las {hora}. Bebé: {bebe}",
          instagramHandle: settings.instagramHandle || "",
          businessAddress: settings.businessAddress || "",
          pollingInterval: settings.notificationPollingInterval || 5,
          expirationDays: settings.notificationExpirationDays || 7,
          maxSlotsStaff: settings.maxSlotsStaff || 5,
          maxSlotsPortal: settings.maxSlotsPortal || 2,
        };

        setQrImage(values.qrImage);
        setQrPreview(values.qrImage);
        setWhatsappCountryCode(values.whatsappCountryCode);
        setWhatsappNumber(values.whatsappNumber);
        setWhatsappMessage(values.whatsappMessage);
        setInstagramHandle(values.instagramHandle);
        setBusinessAddress(values.businessAddress);
        setPollingInterval(values.pollingInterval);
        setExpirationDays(values.expirationDays);
        setMaxSlotsStaff(values.maxSlotsStaff);
        setMaxSlotsPortal(values.maxSlotsPortal);
        setOriginalValues(values);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error(t("settings.actions.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error(t("settings.payment.invalidFormat"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.payment.fileTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQrImage(base64);
      setQrPreview(base64);
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

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentQrImage: qrImage,
          whatsappCountryCode,
          whatsappNumber,
          whatsappMessage,
          instagramHandle: instagramHandle || null,
          businessAddress: businessAddress || null,
          notificationPollingInterval: pollingInterval,
          notificationExpirationDays: expirationDays,
          maxSlotsStaff,
          maxSlotsPortal,
        }),
      });

      if (response.ok) {
        toast.success(t("settings.actions.saved"), {
          icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        });
        // Update original values to match saved
        setOriginalValues({
          qrImage,
          whatsappCountryCode,
          whatsappNumber,
          whatsappMessage,
          instagramHandle,
          businessAddress,
          pollingInterval,
          expirationDays,
          maxSlotsStaff,
          maxSlotsPortal,
        });
        setHasChanges(false);
      } else {
        const data = await response.json();
        if (data.error === "QR_IMAGE_TOO_LARGE") {
          toast.error(t("settings.payment.fileTooLarge"));
        } else if (data.error === "INVALID_WHATSAPP_NUMBER") {
          toast.error(t("settings.payment.invalidPhone"));
        } else if (data.error === "INVALID_MAX_SLOTS_STAFF") {
          toast.error(t("settings.slots.invalidStaff"));
        } else if (data.error === "INVALID_MAX_SLOTS_PORTAL") {
          toast.error(t("settings.slots.invalidPortal"));
        } else {
          toast.error(t("settings.actions.saveError"));
        }
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(t("settings.actions.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="font-medium">Tienes cambios sin guardar</span>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("settings.actions.saveNow")}
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {/* Payment Configuration */}
        <section>
          <div className="mb-4 flex items-center gap-2">
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
                  className="w-24 rounded-xl text-center"
                  placeholder="+591"
                />
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 rounded-xl"
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
                className="min-h-[100px] rounded-xl"
                placeholder={t("settings.payment.messageTemplate")}
              />
              <p className="text-xs text-gray-500">
                {t("settings.payment.messageVariables")}
              </p>
            </div>

            {/* Instagram Handle */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-gray-500" />
                {t("settings.contact.instagram")}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@</span>
                <Input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
                  className="flex-1 rounded-xl"
                  placeholder={t("settings.contact.instagramPlaceholder")}
                />
              </div>
              <p className="text-xs text-gray-500">
                {t("settings.contact.instagramHelp")}
              </p>
            </div>

            {/* Business Address */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {t("settings.contact.address")}
              </Label>
              <Input
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="rounded-xl"
                placeholder={t("settings.contact.addressPlaceholder")}
              />
              <p className="text-xs text-gray-500">
                {t("settings.contact.addressHelp")}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Notification Configuration */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {t("settings.notifications.title")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
                  className="w-24 rounded-xl text-center"
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
                  className="w-24 rounded-xl text-center"
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
        </section>

        <hr className="border-gray-200" />

        {/* Slot Configuration */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {t("settings.slots.title")}
            </h2>
          </div>
          <p className="mb-6 text-sm text-gray-500">
            {t("settings.slots.description")}
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Max Slots for Staff */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                {t("settings.slots.maxStaff")}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxSlotsStaff}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setMaxSlotsStaff(Math.min(10, Math.max(1, value)));
                  }}
                  className="w-24 rounded-xl text-center"
                />
                <span className="text-sm text-gray-500">
                  {t("settings.slots.perSlot")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("settings.slots.maxStaffHelp")}
              </p>
            </div>

            {/* Max Slots for Portal */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-gray-500" />
                {t("settings.slots.maxPortal")}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={maxSlotsPortal}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setMaxSlotsPortal(Math.min(5, Math.max(1, value)));
                  }}
                  className="w-24 rounded-xl text-center"
                />
                <span className="text-sm text-gray-500">
                  {t("settings.slots.perSlot")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {t("settings.slots.maxPortalHelp")}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={cn(
            "h-12 gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all",
            hasChanges
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600"
              : "bg-gray-100 text-gray-400 shadow-none"
          )}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {hasChanges ? t("settings.actions.saveChanges") : t("settings.actions.noChanges")}
        </Button>
      </div>
    </div>
  );
}
