"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Search, UserRound, Loader2, UserPlus, Phone, Mail, Check, CreditCard } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency-utils";

// bundle-dynamic-imports: Lazy load payment dialog
const RegisterPaymentDialog = dynamic(
  () => import("./register-payment-dialog").then((m) => m.RegisterPaymentDialog),
  { ssr: false }
);

interface ParentResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
}

interface AddParentLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  basePrice: number;
  onSuccess?: () => void;
}

export function AddParentLeadDialog({
  open,
  onOpenChange,
  eventId,
  basePrice,
  onSuccess,
}: AddParentLeadDialogProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"search" | "new">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ParentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New LEAD form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pregnancyWeeks, setPregnancyWeeks] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

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

  // Search parents
  useEffect(() => {
    const searchParents = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/parents?search=${encodeURIComponent(searchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.parents || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchParents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectParent = (parent: ParentResult) => {
    setSelectedParent(parent);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        notes: notes || undefined,
      };

      if (activeTab === "search" && selectedParent) {
        payload.parentId = selectedParent.id;
      } else if (activeTab === "new") {
        if (!newName || !newPhone) {
          toast.error(t("errors.NAME_REQUIRED"));
          setIsSubmitting(false);
          return;
        }
        payload.name = newName;
        payload.phone = newPhone;
        payload.email = newEmail || undefined;
        payload.pregnancyWeeks = pregnancyWeeks ? Number(pregnancyWeeks) : undefined;
        payload.leadSource = leadSource || undefined;
        payload.leadNotes = leadNotes || undefined;
      }

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
      const participantName = activeTab === "search" && selectedParent
        ? selectedParent.name
        : newName;

      // If price > 0, show success state with option to register payment
      if (calculatedPrice > 0) {
        setAddedParticipant({
          id: data.participant.id,
          name: participantName,
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
    setActiveTab("search");
    setSelectedParent(null);
    setSearchQuery("");
    setSearchResults([]);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setPregnancyWeeks("");
    setLeadSource("");
    setLeadNotes("");
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

  const canSubmit = activeTab === "search" ? !!selectedParent : (!!newName && !!newPhone);

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
                {t("payment.amountDue")}: <span className="font-semibold text-teal-600">{formatCurrency(Number(addedParticipant.amountDue), locale)}</span>
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
            <UserRound className="h-5 w-5 text-cyan-600" />
            {t("participants.addParentLead")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "new")}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
            <TabsTrigger
              value="search"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-teal-700"
            >
              {t("participants.searchParent")}
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-teal-700"
            >
              {t("participants.registerNewLead")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 pt-4">
            {!selectedParent ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("participants.searchParent")}
                    className="h-12 rounded-xl border-2 border-teal-100 pl-10"
                  />
                </div>

                {(searchResults.length > 0 || isSearching) && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      searchResults.map((parent) => (
                        <button
                          key={parent.id}
                          onClick={() => handleSelectParent(parent)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-teal-50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                            <UserRound className="h-4 w-4 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{parent.name}</p>
                            {parent.phone && (
                              <p className="text-xs text-gray-500">{parent.phone}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      <UserRound className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{selectedParent.name}</p>
                      {selectedParent.phone && (
                        <p className="text-xs text-gray-500">{selectedParent.phone}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedParent(null)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t("lead.name")} *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12 rounded-xl border-2 border-teal-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("lead.phone")} *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-12 rounded-xl border-2 border-teal-100 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("lead.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-12 rounded-xl border-2 border-teal-100 pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("lead.pregnancyWeeks")}</Label>
                <Input
                  type="number"
                  value={pregnancyWeeks}
                  onChange={(e) => setPregnancyWeeks(e.target.value)}
                  min={1}
                  max={45}
                  className="h-12 rounded-xl border-2 border-teal-100"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("lead.source")}</Label>
                <Input
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  placeholder={t("lead.sourcePlaceholder")}
                  className="h-12 rounded-xl border-2 border-teal-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("lead.notes")}</Label>
              <Textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder={t("lead.notesPlaceholder")}
                className="rounded-xl border-2 border-teal-100"
                rows={2}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Discount & Submit - shown for both tabs when valid */}
        {canSubmit && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("discount.amount")} ({getCurrencySymbol(locale)})</Label>
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
                    className="h-12 rounded-xl border-2 border-teal-100"
                  />
                </div>
              </div>
            )}

            {/* Price summary */}
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("payment.amountDue")}</span>
                <span className="text-lg font-bold text-teal-600">
                  {calculatedPrice === 0 ? t("payment.free") : formatCurrency(calculatedPrice, locale)}
                </span>
              </div>
            </div>

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
          </div>
        )}
          </>
        )}
      </DialogContent>

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
