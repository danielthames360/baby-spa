/**
 * Types for bulk scheduling functionality
 */

/**
 * A single schedule preference (day + time)
 */
export interface SchedulePreference {
  /** Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat */
  dayOfWeek: number;
  /** Time in HH:mm format, e.g., "09:00", "15:00" */
  time: string;
}

/**
 * A generated appointment slot from bulk scheduling
 */
export interface GeneratedSlot {
  /** Date for this appointment (UTC noon) */
  date: Date;
  /** Start time in HH:mm format */
  startTime: string;
  /** End time in HH:mm format */
  endTime: string;
  /** Day of week for this slot */
  dayOfWeek: number;
  /** Which preference index was used (for multiple preferences) */
  preferenceIndex: number;
  /** Whether this slot has a scheduling conflict */
  hasConflict: boolean;
  /** Number of existing appointments at this time */
  conflictCount: number;
}

/**
 * Input parameters for generating bulk schedule
 */
export interface BulkSchedulingInput {
  /** Starting date for scheduling (appointments generated from this date forward) */
  startDate: Date;
  /** Array of preferred day/time combinations */
  preferences: SchedulePreference[];
  /** Number of appointments to generate */
  count: number;
  /** Duration of each session in minutes */
  packageDuration: number;
  /** Optional dates to exclude (YYYY-MM-DD format) */
  excludeDates?: string[];
}

/**
 * Information about a scheduling conflict
 */
export interface ConflictInfo {
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Time in HH:mm format */
  time: string;
  /** Number of existing appointments at this slot */
  count: number;
  /** Number of available slots (typically 5 - count) */
  available: number;
}

/**
 * Result from bulk appointment creation API
 */
export interface BulkSchedulingResult {
  /** Number of appointments successfully created */
  created: number;
  /** Array of created appointment IDs */
  appointmentIds: string[];
  /** Any conflicts encountered */
  conflicts: ConflictInfo[];
}
