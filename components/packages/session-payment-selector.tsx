"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { suggestPayOnSessions } from "@/lib/utils/installments";

interface SessionPaymentSelectorProps {
  totalSessions: number;
  installmentsCount: number;
  value: string; // "1,3,5" format
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SessionPaymentSelector({
  totalSessions,
  installmentsCount,
  value,
  onChange,
  disabled = false,
}: SessionPaymentSelectorProps) {
  const t = useTranslations();
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const parsed = value
        .replace(/[\[\]\s]/g, "")
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
      setSelectedSessions(parsed);
    } else {
      setSelectedSessions([]);
    }
  }, [value]);

  // Auto-suggest when installments count changes
  useEffect(() => {
    if (installmentsCount > 0 && totalSessions > 0 && selectedSessions.length === 0) {
      const suggested = suggestPayOnSessions(totalSessions, installmentsCount);
      setSelectedSessions(suggested);
      onChange(suggested.join(","));
    }
  }, [installmentsCount, totalSessions, selectedSessions.length, onChange]);

  const toggleSession = (sessionNumber: number) => {
    if (disabled) return;

    let newSelected: number[];
    if (selectedSessions.includes(sessionNumber)) {
      // Remove if already selected
      newSelected = selectedSessions.filter((s) => s !== sessionNumber);
    } else {
      // Add if not at max
      if (selectedSessions.length < installmentsCount) {
        newSelected = [...selectedSessions, sessionNumber].sort((a, b) => a - b);
      } else {
        // Replace the last one
        newSelected = [...selectedSessions.slice(0, -1), sessionNumber].sort(
          (a, b) => a - b
        );
      }
    }

    setSelectedSessions(newSelected);
    onChange(newSelected.join(","));
  };

  const handleSuggest = () => {
    if (disabled) return;
    const suggested = suggestPayOnSessions(totalSessions, installmentsCount);
    setSelectedSessions(suggested);
    onChange(suggested.join(","));
  };

  if (totalSessions <= 0 || installmentsCount <= 0) {
    return null;
  }

  // Generate session buttons
  const sessions = Array.from({ length: totalSessions }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {t("packages.form.installmentsPayOnSessions")}
        </label>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={disabled}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          {t("packages.form.suggestSessions")}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {t("packages.form.installmentsPayOnSessionsHelp", {
          count: installmentsCount,
          selected: selectedSessions.length,
        })}
      </p>

      <div className="flex flex-wrap gap-2">
        {sessions.map((sessionNum) => {
          const isSelected = selectedSessions.includes(sessionNum);
          const installmentIndex = selectedSessions.indexOf(sessionNum);

          return (
            <button
              key={sessionNum}
              type="button"
              onClick={() => toggleSession(sessionNum)}
              disabled={disabled}
              className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {sessionNum}
              {isSelected && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                  {installmentIndex + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedSessions.length > 0 && (
        <div className="rounded-lg bg-teal-50 p-3">
          <p className="text-sm text-teal-700">
            <span className="font-medium">
              {t("packages.form.paymentSchedule")}:
            </span>{" "}
            {selectedSessions.map((session, idx) => (
              <span key={session}>
                {t("packages.form.installmentOnSession", {
                  installment: idx + 1,
                  session,
                })}
                {idx < selectedSessions.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
