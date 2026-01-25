'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SchedulePreference } from '@/lib/types/scheduling';
import {
  getDayName,
  getAvailableDays,
  DEFAULT_AVAILABLE_TIMES,
} from '@/lib/utils/bulk-scheduling';

interface SchedulePreferenceSelectorProps {
  value: SchedulePreference[];
  onChange: (preferences: SchedulePreference[]) => void;
  maxPreferences?: number;
  disabled?: boolean;
  compact?: boolean;
  showLabel?: boolean;
}

export function SchedulePreferenceSelector({
  value,
  onChange,
  maxPreferences = 6,
  disabled = false,
  compact = false,
  showLabel = true,
}: SchedulePreferenceSelectorProps) {
  const t = useTranslations('bulkScheduling');
  const locale = useLocale();

  const availableDays = getAvailableDays();

  const addPreference = () => {
    if (maxPreferences && value.length >= maxPreferences) return;

    // Find the first unused day
    const usedDays = value.map((p) => p.dayOfWeek);
    const availableDay = availableDays.find((d) => !usedDays.includes(d)) || availableDays[0];

    onChange([...value, { dayOfWeek: availableDay, time: '09:00' }]);
  };

  const removePreference = (index: number) => {
    const newPrefs = value.filter((_, i) => i !== index);
    onChange(newPrefs);
  };

  const updatePreference = (
    index: number,
    field: 'dayOfWeek' | 'time',
    newValue: string | number
  ) => {
    const newPrefs = [...value];
    if (field === 'dayOfWeek') {
      newPrefs[index] = { ...newPrefs[index], dayOfWeek: Number(newValue) };
    } else {
      newPrefs[index] = { ...newPrefs[index], time: String(newValue) };
    }
    onChange(newPrefs);
  };

  const canAddMore = !maxPreferences || value.length < maxPreferences;

  return (
    <div className="space-y-3">
      {showLabel && (
        <Label className="text-sm font-medium text-gray-700">{t('preferredSchedules')}</Label>
      )}

      {value.length === 0 ? (
        <p className="text-sm italic text-gray-500">{t('noPreferenceDefined')}</p>
      ) : (
        <div className="space-y-2">
          {value.map((pref, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 rounded-xl border border-teal-100 bg-white/50 p-3',
                compact && 'p-2'
              )}
            >
              <span className="w-20 shrink-0 text-sm font-medium text-gray-500">
                {t('scheduleNumber', { number: index + 1 })}:
              </span>

              {/* Day selector */}
              <Select
                value={String(pref.dayOfWeek)}
                onValueChange={(val) => updatePreference(index, 'dayOfWeek', val)}
                disabled={disabled}
              >
                <SelectTrigger className={cn('w-32', compact && 'w-28')} size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {getDayName(day, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="shrink-0 text-sm text-gray-500">{t('atTime')}</span>

              {/* Time selector */}
              <Select
                value={pref.time}
                onValueChange={(val) => updatePreference(index, 'time', val)}
                disabled={disabled}
              >
                <SelectTrigger className={cn('w-24', compact && 'w-20')} size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_AVAILABLE_TIMES.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Delete button */}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePreference(index)}
                  className="h-8 w-8 shrink-0 text-gray-400 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {canAddMore && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPreference}
          className="border-dashed border-teal-300 text-teal-600 hover:bg-teal-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('addSchedule')}
        </Button>
      )}
    </div>
  );
}
