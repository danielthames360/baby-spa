/**
 * Bulk Scheduling Utilities
 *
 * Handles generation of bulk appointment slots based on schedule preferences.
 */

import { SchedulePreference, GeneratedSlot, BulkSchedulingInput } from '@/lib/types/scheduling';
import { parseDateToUTCNoon, fromDateOnly } from '@/lib/utils/date-utils';

/**
 * Business hours configuration
 * Note: This should match the BusinessHours model but we use these defaults
 * for initial slot generation. Actual availability is verified via API.
 */
interface BusinessHoursConfig {
  start: string;
  end: string;
  breaks: { start: string; end: string }[];
}

const BUSINESS_HOURS: Record<number, BusinessHoursConfig | null> = {
  // Sunday: closed
  0: null,
  // Monday: continuous schedule
  1: { start: '09:00', end: '17:00', breaks: [] },
  // Tuesday to Saturday: morning and afternoon with break
  2: { start: '09:00', end: '18:30', breaks: [{ start: '12:00', end: '14:30' }] },
  3: { start: '09:00', end: '18:30', breaks: [{ start: '12:00', end: '14:30' }] },
  4: { start: '09:00', end: '18:30', breaks: [{ start: '12:00', end: '14:30' }] },
  5: { start: '09:00', end: '18:30', breaks: [{ start: '12:00', end: '14:30' }] },
  6: { start: '09:00', end: '18:30', breaks: [{ start: '12:00', end: '14:30' }] },
};

/**
 * Day names for display
 */
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Check if a time is within business hours for a specific day
 */
export function isWithinBusinessHours(dayOfWeek: number, time: string): boolean {
  const hours = BUSINESS_HOURS[dayOfWeek];
  if (!hours) return false;

  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(hours.start);
  const endMinutes = timeToMinutes(hours.end);

  // Check if within general hours
  if (timeMinutes < startMinutes || timeMinutes >= endMinutes) return false;

  // Check if in a break
  for (const breakTime of hours.breaks) {
    const breakStartMinutes = timeToMinutes(breakTime.start);
    const breakEndMinutes = timeToMinutes(breakTime.end);

    if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

/**
 * Generate bulk schedule slots based on preferences
 *
 * @param input - Scheduling input parameters
 * @returns Array of generated slots
 */
export function generateBulkSchedule(input: BulkSchedulingInput): GeneratedSlot[] {
  const { startDate, preferences, count, packageDuration, excludeDates = [] } = input;

  if (preferences.length === 0 || count <= 0) return [];

  const slots: GeneratedSlot[] = [];

  // Create a working copy of the start date
  const currentDate = new Date(startDate);

  // Sort preferences by day of week for consistency (Sunday at end)
  const sortedPrefs = [...preferences].sort((a, b) => {
    // Put Sunday (0) at the end if it ever exists
    const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return dayA - dayB;
  });

  // Safety limit: maximum 365 days ahead
  const maxDate = new Date(startDate);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  while (slots.length < count && currentDate < maxDate) {
    const dayOfWeek = currentDate.getDay();

    // Find if there's a preference for this day
    const prefIndex = sortedPrefs.findIndex((p) => p.dayOfWeek === dayOfWeek);

    if (prefIndex !== -1) {
      const pref = sortedPrefs[prefIndex];

      // Check if within business hours
      if (isWithinBusinessHours(dayOfWeek, pref.time)) {
        // Check if not an excluded date
        const dateStr = fromDateOnly(currentDate);
        if (!excludeDates.includes(dateStr)) {
          const endTime = calculateEndTime(pref.time, packageDuration);

          // Create the slot with UTC noon date
          slots.push({
            date: parseDateToUTCNoon(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              currentDate.getDate()
            ),
            startTime: pref.time,
            endTime,
            dayOfWeek,
            preferenceIndex: prefIndex,
            hasConflict: false,
            conflictCount: 0,
          });
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

/**
 * Parse schedule preferences from JSON string (database format)
 */
export function parseSchedulePreferences(json: string | null | undefined): SchedulePreference[] {
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (p): p is SchedulePreference =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.dayOfWeek === 'number' &&
        typeof p.time === 'string' &&
        p.dayOfWeek >= 0 &&
        p.dayOfWeek <= 6
    );
  } catch {
    return [];
  }
}

/**
 * Convert schedule preferences to JSON string for database storage
 */
export function stringifySchedulePreferences(preferences: SchedulePreference[]): string {
  return JSON.stringify(preferences);
}

/**
 * Get the display name for a day of the week
 */
export function getDayName(dayOfWeek: number, locale: string = 'es'): string {
  const days = locale === 'pt-BR' ? DAY_NAMES_PT : DAY_NAMES_ES;
  return days[dayOfWeek] || '';
}

/**
 * Get short day name (3 letters)
 */
export function getDayNameShort(dayOfWeek: number, locale: string = 'es'): string {
  const fullName = getDayName(dayOfWeek, locale);
  return fullName.slice(0, 3);
}

/**
 * Format schedule preferences as readable text
 *
 * @example
 * formatPreferencesText([{dayOfWeek: 1, time: "09:00"}, {dayOfWeek: 4, time: "15:00"}], "es")
 * // Returns: "Lunes 09:00, Jueves 15:00"
 */
export function formatPreferencesText(
  preferences: SchedulePreference[],
  locale: string = 'es'
): string {
  if (preferences.length === 0) return '';

  return preferences.map((p) => `${getDayName(p.dayOfWeek, locale)} ${p.time}`).join(', ');
}

/**
 * Validate if a preference is valid for scheduling
 */
export function isValidPreference(pref: SchedulePreference): boolean {
  // Day must be 1-6 (Mon-Sat, Sunday is closed)
  if (pref.dayOfWeek < 1 || pref.dayOfWeek > 6) return false;

  // Time must be in valid format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(pref.time)) return false;

  // Time must be within business hours
  return isWithinBusinessHours(pref.dayOfWeek, pref.time);
}

/**
 * Get available times for a specific day of week
 * Returns times in 30-minute increments within business hours
 */
export function getAvailableTimesForDay(dayOfWeek: number): string[] {
  const hours = BUSINESS_HOURS[dayOfWeek];
  if (!hours) return [];

  const times: string[] = [];
  let currentMinutes = timeToMinutes(hours.start);
  const endMinutes = timeToMinutes(hours.end);

  while (currentMinutes < endMinutes) {
    const time = minutesToTime(currentMinutes);
    if (isWithinBusinessHours(dayOfWeek, time)) {
      times.push(time);
    }
    currentMinutes += 30; // 30-minute increments
  }

  return times;
}

/**
 * Get available days for scheduling (Mon-Sat)
 */
export function getAvailableDays(): number[] {
  return [1, 2, 3, 4, 5, 6]; // Monday to Saturday
}

/**
 * Default available times for the selector UI
 */
export const DEFAULT_AVAILABLE_TIMES = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
];

/**
 * Check if a slot might have conflicts (used before actual API check)
 * Returns true if there might be conflicts based on common patterns
 */
export function mightHaveConflicts(slot: GeneratedSlot): boolean {
  // Popular times that are often busy
  const busyTimes = ['09:00', '10:00', '15:00', '16:00'];
  return busyTimes.includes(slot.startTime);
}

/**
 * Calculate how many weeks the schedule spans
 */
export function calculateScheduleSpan(slots: GeneratedSlot[]): {
  weeks: number;
  startDate: Date | null;
  endDate: Date | null;
} {
  if (slots.length === 0) {
    return { weeks: 0, startDate: null, endDate: null };
  }

  const startDate = slots[0].date;
  const endDate = slots[slots.length - 1].date;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(diffDays / 7);

  return { weeks, startDate, endDate };
}
