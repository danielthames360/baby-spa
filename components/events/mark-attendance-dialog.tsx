"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  status: string;
  attended: boolean | null;
  baby?: {
    id: string;
    name: string;
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
}

interface MarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  participants: Participant[];
  onSuccess: () => void;
}

export function MarkAttendanceDialog({
  open,
  onOpenChange,
  eventId,
  participants,
  onSuccess,
}: MarkAttendanceDialogProps) {
  const t = useTranslations("events");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, boolean | null>>(() => {
    const initial: Record<string, boolean | null> = {};
    participants.forEach((p) => {
      initial[p.id] = p.attended;
    });
    return initial;
  });

  // Filter only active participants (not cancelled)
  const activeParticipants = participants.filter((p) => p.status !== "CANCELLED");

  const handleToggle = (participantId: string, value: boolean | null) => {
    setAttendance((prev) => ({
      ...prev,
      [participantId]: prev[participantId] === value ? null : value,
    }));
  };

  const handleMarkAll = (value: boolean) => {
    const newAttendance: Record<string, boolean | null> = {};
    activeParticipants.forEach((p) => {
      newAttendance[p.id] = value;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build attendance array from state
      const attendanceArray = Object.entries(attendance)
        .filter(([, value]) => value !== null)
        .map(([participantId, attended]) => ({
          participantId,
          attended: attended as boolean,
        }));

      const response = await fetch(`/api/events/${eventId}/participants/bulk-attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: attendanceArray }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error marking attendance");
      }

      toast.success(t("messages.attendanceMarked"));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // js-combine-iterations: Single iteration to count both values
  const { attendedCount, notAttendedCount } = Object.values(attendance).reduce(
    (acc, v) => {
      if (v === true) acc.attendedCount++;
      else if (v === false) acc.notAttendedCount++;
      return acc;
    },
    { attendedCount: 0, notAttendedCount: 0 }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            {t("attendance.markAttendance")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll(true)}
              className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="mr-1 h-4 w-4" />
              {t("attendance.markAllAttended")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll(false)}
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <X className="mr-1 h-4 w-4" />
              {t("attendance.markAllAbsent")}
            </Button>
          </div>

          {/* Participants list */}
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {activeParticipants.map((participant) => {
              const name = participant.baby?.name || participant.parent?.name || "Unknown";
              const currentValue = attendance[participant.id];

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3"
                >
                  <span className="font-medium text-gray-700">{name}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(participant.id, true)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                        currentValue === true
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-white text-gray-400 hover:bg-emerald-50 hover:text-emerald-500"
                      )}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(participant.id, false)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                        currentValue === false
                          ? "bg-rose-500 text-white shadow-md"
                          : "bg-white text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                      )}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-2 text-sm">
            <span className="text-gray-600">{t("attendance.summary")}:</span>
            <div className="flex gap-3">
              <span className="text-emerald-600">
                <Check className="mr-1 inline h-4 w-4" />
                {attendedCount}
              </span>
              <span className="text-rose-600">
                <X className="mr-1 inline h-4 w-4" />
                {notAttendedCount}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("attendance.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
