"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Play, Baby, User } from "lucide-react";

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  babyName: string;
  startTime: string;
  onSuccess?: () => void;
}

interface Therapist {
  id: string;
  name: string;
}

export function StartSessionDialog({
  open,
  onOpenChange,
  appointmentId,
  babyName,
  startTime,
  onSuccess,
}: StartSessionDialogProps) {
  const t = useTranslations();

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<string>("");
  const [isLoadingTherapists, setIsLoadingTherapists] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTherapists();
    }
  }, [open]);

  const fetchTherapists = async () => {
    setIsLoadingTherapists(true);
    try {
      const response = await fetch("/api/therapists");
      const data = await response.json();
      if (response.ok) {
        setTherapists(data.therapists || []);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setIsLoadingTherapists(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTherapist) {
      setError(t("session.errors.SELECT_THERAPIST"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          therapistId: selectedTherapist,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`session.errors.${errorKey}`));
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error starting session:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Play className="h-5 w-5 text-white" />
            </div>
            {t("session.startSession")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Appointment info */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{babyName}</p>
              <p className="text-sm text-blue-600">{startTime}</p>
            </div>
          </div>

          {/* Therapist selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              {t("session.selectTherapist")}
            </Label>
            {isLoadingTherapists ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <Select
                value={selectedTherapist}
                onValueChange={setSelectedTherapist}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                  <SelectValue placeholder={t("session.selectTherapistPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 border-gray-200"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedTherapist}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 text-white shadow-lg shadow-blue-300/50 transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("session.start")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
