"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Gift, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UseRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
  rewardId: string;
  rewardName: string;
  onSuccess: () => void;
}

export function UseRewardDialog({
  open,
  onOpenChange,
  purchaseId,
  rewardId,
  rewardName,
  onSuccess,
}: UseRewardDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUseReward = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/baby-cards/purchases/${purchaseId}/rewards/${rewardId}/use`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes || null }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to use reward");
      }

      onSuccess();
      onOpenChange(false);
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setNotes("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
              <Gift className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("babyCard.rewards.useReward")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {t("babyCard.rewards.useRewardDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Info */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Gift className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{rewardName}</p>
                <p className="text-sm text-emerald-600">
                  {t("babyCard.rewards.readyToUse")}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700">
              {t("babyCard.rewards.useWarning")}
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-gray-700">{t("babyCard.rewards.notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("babyCard.rewards.notesPlaceholder")}
              className="mt-2 min-h-[80px] rounded-xl border-2 border-gray-200 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {t(`babyCard.errors.${error}`) || error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl border-2 border-gray-200"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUseReward}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-lg shadow-emerald-300/50 transition-all hover:from-emerald-600 hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("babyCard.rewards.confirmUse")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
