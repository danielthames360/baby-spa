"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Baby,
  Calendar,
  Clock,
  Search,
  Loader2,
  AlertCircle,
  User,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BabySearchResult {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  parents: {
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string;
    };
  }[];
  packagePurchases: {
    id: string;
    remainingSessions: number;
    isActive: boolean;
    package: {
      name: string;
    };
  }[];
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  time: string;
  onSuccess?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  date,
  time,
  onSuccess,
}: AppointmentDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-ES";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BabySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState<BabySearchResult | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBaby(null);
      setNotes("");
      setError(null);
    }
  }, [open]);

  // Search babies
  const searchBabies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/babies?search=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSearchResults(data.babies || []);
    } catch (err) {
      console.error("Error searching babies:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchBabies(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchBabies]);

  // Get active package for selected baby
  const activePackage = selectedBaby?.packagePurchases.find(
    (p) => p.isActive && p.remainingSessions > 0
  );

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedBaby) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyId: selectedBaby.id,
          // Use local date format to avoid timezone issues
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          startTime: time,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map error codes to translation keys
        const errorKey = data.error || "UNKNOWN_ERROR";
        setError(t(`calendar.errors.${errorKey}`));
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formattedDate = date.toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            {t("calendar.newAppointment")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date & Time display */}
          <div className="flex gap-4 rounded-xl bg-teal-50 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-gray-700">{time}</span>
            </div>
          </div>

          {/* Baby search */}
          {!selectedBaby ? (
            <div className="space-y-3">
              <Label className="text-gray-700">{t("calendar.searchBaby")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("calendar.searchBabyPlaceholder")}
                  className="h-12 rounded-xl border-2 border-teal-100 pl-10 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-500" />
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
                  {searchResults.map((baby) => {
                    const babyActivePackage = baby.packagePurchases.find(
                      (p) => p.isActive && p.remainingSessions > 0
                    );
                    const primaryParent = baby.parents.find((p) => p.isPrimary);

                    return (
                      <button
                        key={baby.id}
                        onClick={() => setSelectedBaby(baby)}
                        className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-teal-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                            <Baby className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{baby.name}</p>
                            {primaryParent && (
                              <p className="text-sm text-gray-500">
                                {primaryParent.parent.name}
                              </p>
                            )}
                          </div>
                        </div>
                        {babyActivePackage ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            {babyActivePackage.remainingSessions} {t("common.sessionsUnit")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            {t("calendar.noPackage")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-center text-sm text-gray-500">
                  {t("common.noResults")}
                </p>
              )}
            </div>
          ) : (
            /* Selected baby */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border-2 border-teal-200 bg-teal-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500">
                    <Baby className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedBaby.name}</p>
                    {selectedBaby.parents.find((p) => p.isPrimary) && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        {selectedBaby.parents.find((p) => p.isPrimary)?.parent.name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBaby(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {t("calendar.change")}
                </Button>
              </div>

              {/* Package info */}
              {activePackage ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-800">
                      {activePackage.package.name}
                    </p>
                    <p className="text-sm text-emerald-600">
                      {activePackage.remainingSessions} {t("calendar.sessionsAvailable")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {t("calendar.trialSession")}
                    </p>
                    <p className="text-sm text-blue-600">
                      {t("calendar.trialSessionDesc")}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-gray-700">{t("calendar.notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("calendar.notesPlaceholder")}
                  className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-2 border-gray-200"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedBaby || isSubmitting}
              className={cn(
                "rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600",
                !selectedBaby && "opacity-50"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("calendar.schedule")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
