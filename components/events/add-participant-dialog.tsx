"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Search, Baby, Loader2, UserPlus, Plus, Check, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RegisterClientDialog } from "./register-client-dialog";
import { RegisterPaymentDialog } from "./register-payment-dialog";

interface BabyResult {
  id: string;
  name: string;
  birthDate: string;
  parents: {
    isPrimary: boolean;
    parent: {
      name: string;
      phone: string | null;
    };
  }[];
}

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  basePrice: number;
  onSuccess?: () => void;
}

export function AddParticipantDialog({
  open,
  onOpenChange,
  eventId,
  basePrice,
  onSuccess,
}: AddParticipantDialogProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BabyResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<BabyResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // State for success + register payment flow
  const [addedParticipant, setAddedParticipant] = useState<{
    id: string;
    name: string;
    amountDue: number;
  } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Discount state
  const [discountType, setDiscountType] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [discountReason, setDiscountReason] = useState("");
  const [notes, setNotes] = useState("");

  // Search babies
  useEffect(() => {
    const searchBabies = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/babies?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.babies || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchBabies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectBaby = (baby: BabyResult) => {
    setSelectedBaby(baby);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleNewClientRegistered = (baby: BabyResult) => {
    // Auto-select the newly registered baby
    setSelectedBaby(baby);
    setSearchQuery("");
    setSearchResults([]);
    toast.success(t("messages.clientRegistered"));
  };

  const handleSubmit = async () => {
    if (!selectedBaby) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        babyId: selectedBaby.id,
        notes: notes || undefined,
      };

      if (discountType === "COURTESY") {
        payload.discountType = "COURTESY";
      } else if (discountType === "FIXED" && discountAmount) {
        payload.discountType = "FIXED";
        payload.discountAmount = Number(discountAmount);
        payload.discountReason = discountReason || undefined;
      }

      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error adding participant");
      }

      const data = await response.json();

      // If price > 0, show success state with option to register payment
      if (calculatedPrice > 0) {
        setAddedParticipant({
          id: data.participant.id,
          name: selectedBaby.name,
          amountDue: calculatedPrice,
        });
        toast.success(t("messages.participantAdded"));
        onSuccess?.();
        router.refresh();
      } else {
        // Free/courtesy - just close
        toast.success(t("messages.participantAdded"));
        onOpenChange(false);
        resetForm();
        onSuccess?.();
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error";
      if (message === "EVENT_ALREADY_REGISTERED") {
        toast.error(t("errors.EVENT_ALREADY_REGISTERED"));
      } else if (message === "EVENT_FULL") {
        toast.error(t("errors.EVENT_FULL"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedBaby(null);
    setSearchQuery("");
    setSearchResults([]);
    setDiscountType("");
    setDiscountAmount("");
    setDiscountReason("");
    setNotes("");
    setAddedParticipant(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleRegisterPayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    resetForm();
    onOpenChange(false);
    router.refresh();
  };

  const calculatedPrice = discountType === "COURTESY"
    ? 0
    : discountType === "FIXED" && discountAmount
      ? Math.max(0, basePrice - Number(discountAmount))
      : basePrice;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-md rounded-2xl">
        {/* Success state - participant added, ask about payment */}
        {addedParticipant ? (
          <>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                {t("messages.participantAdded")}
              </h3>
              <p className="mt-2 text-gray-600">
                <span className="font-medium">{addedParticipant.name}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t("payment.amountDue")}: <span className="font-semibold text-teal-600">Bs. {addedParticipant.amountDue}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl border-2"
              >
                {t("payment.payLater")}
              </Button>
              <Button
                onClick={handleRegisterPayment}
                className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-300/50"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("payment.registerNow")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Baby className="h-5 w-5 text-teal-600" />
                {t("participants.addBaby")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
          {/* Search or Selected */}
          {!selectedBaby ? (
            <div className="space-y-2">
              <Label>{t("participants.searchBaby")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("participants.searchBaby")}
                  className="h-12 rounded-xl border-2 border-teal-100 pl-10"
                />
              </div>

              {/* Search results */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    searchResults.map((baby) => {
                      const parent = baby.parents.find((p) => p.isPrimary)?.parent;
                      return (
                        <button
                          key={baby.id}
                          onClick={() => handleSelectBaby(baby)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-teal-50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                            <Baby className="h-4 w-4 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{baby.name}</p>
                            {parent && (
                              <p className="text-xs text-gray-500">{parent.name}</p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Register new client section */}
              <div className="mt-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30 p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {t("participants.firstTimeVisit")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterDialog(true)}
                    className="mt-2 h-10 rounded-xl border-2 border-teal-300 bg-white font-medium text-teal-600 transition-all hover:bg-teal-50 hover:text-teal-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("participants.registerNew")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                    <Baby className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedBaby.name}</p>
                    {selectedBaby.parents[0] && (
                      <p className="text-xs text-gray-500">
                        {selectedBaby.parents[0].parent.name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBaby(null)}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Discount */}
          {selectedBaby && (
            <>
              <div className="space-y-2">
                <Label>{t("discount.type")}</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                    <SelectValue placeholder={t("discount.noDiscount")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("discount.noDiscount")}</SelectItem>
                    <SelectItem value="COURTESY">{t("discount.courtesy")}</SelectItem>
                    <SelectItem value="FIXED">{t("discount.fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountType === "FIXED" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("discount.amount")} (Bs.)</Label>
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="h-12 rounded-xl border-2 border-teal-100"
                      min={0}
                      max={basePrice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("discount.reason")}</Label>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder={t("discount.reasonPlaceholder")}
                      className="h-12 rounded-xl border-2 border-teal-100"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>{t("form.notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-2 border-teal-100"
                  rows={2}
                />
              </div>

              {/* Price summary */}
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("payment.amountDue")}</span>
                  <span className="text-lg font-bold text-teal-600">
                    {calculatedPrice === 0 ? t("payment.free") : `Bs. ${calculatedPrice.toFixed(0)}`}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {tCommon("add")}
              </Button>
            </>
          )}
            </div>
          </>
        )}
      </DialogContent>

      {/* Register New Client Dialog */}
      <RegisterClientDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        onSuccess={handleNewClientRegistered}
      />

      {/* Register Payment Dialog */}
      {addedParticipant && (
        <RegisterPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          eventId={eventId}
          participantId={addedParticipant.id}
          participantName={addedParticipant.name}
          amountDue={addedParticipant.amountDue}
          amountPaid={0}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Dialog>
  );
}
