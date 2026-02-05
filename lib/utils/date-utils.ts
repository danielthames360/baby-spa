/**
 * Date utilities for timezone-safe date handling
 *
 * IMPORTANT: All dates in this system are stored as UTC noon (12:00:00Z)
 * This ensures the date never shifts regardless of timezone (-12 to +14)
 *
 * Example: "2026-01-23" is stored as "2026-01-23T12:00:00.000Z"
 */

/**
 * Convert a date string (YYYY-MM-DD) to a Date object at UTC noon
 * Use this when SAVING dates to the database
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at 12:00:00 UTC
 *
 * @example
 * toDateOnly("2026-01-23") // Returns: 2026-01-23T12:00:00.000Z
 */
export function toDateOnly(dateString: string): Date {
  // Parse as UTC noon to avoid timezone day-shift issues
  return new Date(`${dateString}T12:00:00Z`);
}

/**
 * Convert a Date object to a date string (YYYY-MM-DD)
 * Use this when READING dates from the database for display
 *
 * @param date - Date object (should be stored at UTC noon)
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * fromDateOnly(new Date("2026-01-23T12:00:00.000Z")) // Returns: "2026-01-23"
 */
export function fromDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Extract YYYY-MM-DD from a Date object OR ISO date string
 * Use this when data may come as Date (from Prisma) or string (from JSON serialization)
 *
 * @param input - Date object or ISO date string (e.g., "2026-01-23" or "2026-01-23T12:00:00.000Z")
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * extractDateString(new Date("2026-01-23T12:00:00.000Z")) // Returns: "2026-01-23"
 * extractDateString("2026-01-23T12:00:00.000Z") // Returns: "2026-01-23"
 * extractDateString("2026-01-23") // Returns: "2026-01-23"
 */
export function extractDateString(input: Date | string): string {
  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }
  // Handle both "2026-01-23" and "2026-01-23T12:00:00.000Z"
  return input.split("T")[0];
}

/**
 * Parse date components and return a Date at UTC noon
 * Use this when you have year, month, day separately
 *
 * @param year - Full year (e.g., 2026)
 * @param month - Month (1-12, NOT 0-indexed)
 * @param day - Day of month (1-31)
 * @returns Date object at 12:00:00 UTC
 *
 * @example
 * parseDateToUTCNoon(2026, 1, 23) // Returns: 2026-01-23T12:00:00.000Z
 */
export function parseDateToUTCNoon(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/**
 * Normalize any Date to UTC noon (12:00:00Z)
 * Use this to ensure consistent storage regardless of input timezone
 *
 * @param date - Any Date object
 * @returns New Date object at 12:00:00 UTC on the same calendar date
 *
 * @example
 * normalizeToUTCNoon(new Date("2026-01-23T03:30:00-04:00")) // Returns: 2026-01-23T12:00:00.000Z
 */
export function normalizeToUTCNoon(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(12, 0, 0, 0);
  return normalized;
}

/**
 * Get today's date at UTC noon
 * Use this for queries that need "today" as a date-only value
 *
 * @returns Today's date at 12:00:00 UTC
 */
export function getTodayUTCNoon(): Date {
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  return today;
}

/**
 * Get the start of a day in UTC (00:00:00Z)
 * Use this for date RANGE queries (gte)
 *
 * @param date - Any Date object
 * @returns Date at 00:00:00 UTC
 */
export function getStartOfDayUTC(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of a day in UTC (23:59:59.999Z)
 * Use this for date RANGE queries (lte)
 *
 * @param date - Any Date object
 * @returns Date at 23:59:59.999 UTC
 */
export function getEndOfDayUTC(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Check if two dates are the same calendar day (ignoring time)
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return fromDateOnly(date1) === fromDateOnly(date2);
}

/**
 * Parse a date string from user input and return UTC noon
 * Handles YYYY-MM-DD format from date inputs
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date at UTC noon, or null if invalid
 */
export function parseDateInput(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  const parts = dateString.split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  return parseDateToUTCNoon(year, month, day);
}

/**
 * Extract local date as YYYY-MM-DD string from a Date object
 * Use this in FRONTEND when sending dates to API
 *
 * IMPORTANT: Use this instead of toISOString().split("T")[0]
 * toISOString() converts to UTC which can shift the day!
 *
 * @param date - Any Date object
 * @returns Date string in YYYY-MM-DD format using LOCAL date components
 *
 * @example
 * // User in Bolivia (UTC-4) selects Feb 5th at 10pm local time
 * const d = new Date(2026, 1, 5, 22, 0, 0); // Feb 5, 2026 22:00 local
 * formatLocalDateString(d) // Returns: "2026-02-05" (correct!)
 * d.toISOString().split("T")[0] // Would return: "2026-02-06" (WRONG - shifted to UTC!)
 */
export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a database date for display WITHOUT timezone conversion
 * Use this when DISPLAYING dates from the database
 *
 * IMPORTANT: Database dates are stored at UTC midnight/noon.
 * Using toLocaleDateString() directly would shift the date in negative UTC offsets.
 * This function extracts UTC components and formats them correctly.
 *
 * @param dateInput - Date string from DB (ISO format) or Date object
 * @param locale - Locale for formatting (e.g., "es-ES", "pt-BR")
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * // Database has: "2026-02-06T00:00:00.000Z"
 * // User in Bolivia (UTC-4)
 * formatDateForDisplay("2026-02-06T00:00:00.000Z", "es-ES", { weekday: "long", day: "numeric", month: "long" })
 * // Returns: "viernes, 6 de febrero" (correct!)
 * // Using toLocaleDateString would return: "jueves, 5 de febrero" (WRONG!)
 */
export function formatDateForDisplay(
  dateInput: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  // Extract UTC components to avoid timezone shift
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Create a date at noon LOCAL time with the UTC date components
  // This ensures toLocaleDateString displays the correct date
  const displayDate = new Date(year, month, day, 12, 0, 0);

  return displayDate.toLocaleDateString(locale, options);
}

