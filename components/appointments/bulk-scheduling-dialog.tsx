'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, AlertTriangle, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { SchedulePreferenceSelector } from './schedule-preference-selector';
import { SchedulePreference, GeneratedSlot } from '@/lib/types/scheduling';
import {
  generateBulkSchedule,
  formatPreferencesText,
  getDayName,
} from '@/lib/utils/bulk-scheduling';
import { formatDateForDisplay, fromDateOnly } from '@/lib/utils/date-utils';

// Default preference to avoid creating new objects on each render
const DEFAULT_PREFERENCE: SchedulePreference[] = [{ dayOfWeek: 2, time: '09:00' }];

interface BulkSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  packagePurchaseId: string;
  packageName: string;
  availableSessions: number;
  packageDuration: number;
  parentPreferences?: SchedulePreference[];
  onComplete: (createdCount: number) => void;
}

export function BulkSchedulingDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  packagePurchaseId,
  packageName,
  availableSessions,
  packageDuration,
  parentPreferences = [],
  onComplete,
}: BulkSchedulingDialogProps) {
  const t = useTranslations('bulkScheduling');
  const locale = useLocale();

  // Track previous open state to only reset when dialog opens
  const prevOpenRef = useRef(false);

  // State
  const [mode, setMode] = useState<'parent' | 'custom'>('custom');
  const [customPreferences, setCustomPreferences] = useState<SchedulePreference[]>(DEFAULT_PREFERENCE);
  const [sessionCount, setSessionCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Active preferences based on mode
  const activePreferences = mode === 'parent' ? parentPreferences : customPreferences;

  // Generate slots when preferences change
  const generatedSlots = useMemo(() => {
    if (activePreferences.length === 0) return [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    return generateBulkSchedule({
      startDate: tomorrow,
      preferences: activePreferences,
      count: sessionCount,
      packageDuration,
    });
  }, [activePreferences, sessionCount, packageDuration]);

  // Check conflicts when slots change
  const checkConflicts = useCallback(async (slots: GeneratedSlot[]) => {
    if (slots.length === 0) {
      setConflicts(new Map());
      return;
    }

    setIsCheckingConflicts(true);
    try {
      const dates = [...new Set(slots.map((s) => fromDateOnly(s.date)))];
      const times = [...new Set(slots.map((s) => s.startTime))];

      const response = await fetch(
        `/api/appointments/check-conflicts?dates=${dates.join(',')}&times=${times.join(',')}`
      );

      if (response.ok) {
        const data = await response.json();
        const conflictMap = new Map<string, number>();
        data.conflicts?.forEach((c: { date: string; time: string; count: number }) => {
          conflictMap.set(`${c.date}-${c.time}`, c.count);
        });
        setConflicts(conflictMap);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setIsCheckingConflicts(false);
    }
  }, []);

  // Debounced conflict check
  useEffect(() => {
    if (generatedSlots.length === 0) {
      setConflicts(new Map());
      return;
    }

    const debounce = setTimeout(() => {
      checkConflicts(generatedSlots);
    }, 500);

    return () => clearTimeout(debounce);
  }, [generatedSlots, checkConflicts]);

  // Count slots with conflicts (>= 5 appointments)
  const conflictCount = useMemo(() => {
    let count = 0;
    generatedSlots.forEach((slot) => {
      const dateStr = fromDateOnly(slot.date);
      const key = `${dateStr}-${slot.startTime}`;
      if ((conflicts.get(key) || 0) >= 5) count++;
    });
    return count;
  }, [generatedSlots, conflicts]);

  // Create appointments
  const handleCreateAppointments = async () => {
    if (generatedSlots.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          packagePurchaseId,
          appointments: generatedSlots.map((slot) => ({
            date: fromDateOnly(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create appointments');
      }

      const data = await response.json();
      onComplete(data.created || generatedSlots.length);
      onOpenChange(false);
    } catch (err) {
      console.error('Error creating appointments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when dialog opens (only when transitioning from closed to open)
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    // Only reset state when dialog is opening (was closed, now open)
    if (open && !wasOpen) {
      setMode(parentPreferences.length > 0 ? 'parent' : 'custom');
      setCustomPreferences(
        parentPreferences.length > 0 ? [...parentPreferences] : DEFAULT_PREFERENCE
      );
      setSessionCount(availableSessions);
      setError(null);
      setConflicts(new Map());
    }
  }, [open, parentPreferences, availableSessions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {babyName} - {packageName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          {/* Package info */}
          <div className="rounded-xl bg-teal-50 p-3">
            <p className="text-sm text-teal-700">
              {t('availableToSchedule')}: <strong>{availableSessions}</strong> {t('sessions')}
            </p>
          </div>

          {/* Parent preference (if exists) */}
          {parentPreferences.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <span>💡</span> {t('parentPreference')}:
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {formatPreferencesText(parentPreferences, locale)}
                </p>
              </div>

              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'parent' | 'custom')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="mode-parent" />
                  <Label htmlFor="mode-parent" className="cursor-pointer">
                    {t('useParentPreference')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="mode-custom" />
                  <Label htmlFor="mode-custom" className="cursor-pointer">
                    {t('defineDifferent')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Custom preference selector */}
          {(parentPreferences.length === 0 || mode === 'custom') && (
            <SchedulePreferenceSelector value={customPreferences} onChange={setCustomPreferences} />
          )}

          {/* Session count */}
          <div className="space-y-2">
            <Label>{t('sessionsToSchedule')}</Label>
            <Input
              type="number"
              min={1}
              max={availableSessions}
              value={sessionCount}
              onChange={(e) =>
                setSessionCount(Math.min(Math.max(1, Number(e.target.value)), availableSessions))
              }
              className="w-32"
            />
          </div>

          {/* Preview */}
          {generatedSlots.length > 0 && (
            <div className="space-y-2">
              <Label>{t('preview')}</Label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                <div className="space-y-1 p-2">
                  {generatedSlots.map((slot, index) => {
                    const dateStr = fromDateOnly(slot.date);
                    const key = `${dateStr}-${slot.startTime}`;
                    const slotConflicts = conflicts.get(key) || 0;
                    const isFull = slotConflicts >= 5;

                    return (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center justify-between rounded-lg p-2 text-sm',
                          isFull ? 'bg-amber-50' : 'bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isFull ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Check className="h-4 w-4 text-emerald-500" />
                          )}
                          <span>
                            {getDayName(slot.dayOfWeek, locale)}{' '}
                            {formatDateForDisplay(slot.date, locale === 'pt-BR' ? 'pt-BR' : 'es', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {isFull && (
                          <span className="text-xs text-amber-600">
                            ({slotConflicts} {t('existing')})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isCheckingConflicts && (
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('checkingConflicts')}
                </p>
              )}

              {conflictCount > 0 && !isCheckingConflicts && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm text-amber-700">
                    {t('conflictWarning', { count: conflictCount })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreateAppointments}
            disabled={isLoading || generatedSlots.length === 0 || activePreferences.length === 0}
            className="bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {t('generateAppointments', { count: generatedSlots.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
