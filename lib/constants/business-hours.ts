// Business hours configuration for STAFF view (continuous, no lunch break)
// Note: Parent portal will have different restrictions (lunch break, limited slots)
export const BUSINESS_HOURS: Record<number, { periods: { start: string; end: string }[] } | null> = {
  0: null, // Sunday - closed
  1: { periods: [{ start: "09:00", end: "19:00" }] }, // Monday
  2: { periods: [{ start: "09:00", end: "19:00" }] }, // Tuesday
  3: { periods: [{ start: "09:00", end: "19:00" }] }, // Wednesday
  4: { periods: [{ start: "09:00", end: "19:00" }] }, // Thursday
  5: { periods: [{ start: "09:00", end: "19:00" }] }, // Friday
  6: { periods: [{ start: "09:00", end: "19:00" }] }, // Saturday
};

// Maximum appointments per slot for different user types
// Parents see max 2 (they use waitlist for more)
// Staff can book up to 5 (depending on therapists available that day)
export const MAX_APPOINTMENTS_FOR_PARENTS = 2;
export const MAX_APPOINTMENTS_FOR_STAFF = 5;

// Default used in most places (staff limit)
export const MAX_APPOINTMENTS_PER_SLOT = MAX_APPOINTMENTS_FOR_STAFF;

// Slot duration in minutes (30 = half-hour slots, 60 = hourly slots)
export const SLOT_DURATION_MINUTES = 30;

// Helper functions
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function addMinutes(timeStr: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(timeStr);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
}

// Generate time slots for a day based on business hours
export function generateTimeSlots(dayOfWeek: number): string[] {
  const hours = BUSINESS_HOURS[dayOfWeek];
  if (!hours) return [];

  const slots: string[] = [];

  for (const period of hours.periods) {
    let currentTime = period.start;
    const endTime = period.end;

    while (currentTime < endTime) {
      slots.push(currentTime);
      currentTime = addMinutes(currentTime, SLOT_DURATION_MINUTES);
    }
  }

  return slots;
}

// Get end time for a slot
export function getSlotEndTime(startTime: string): string {
  return addMinutes(startTime, SLOT_DURATION_MINUTES);
}

// Check if a time is within business hours
export function isWithinBusinessHours(date: Date, timeStr: string): boolean {
  const dayOfWeek = date.getDay();
  const hours = BUSINESS_HOURS[dayOfWeek];

  if (!hours) return false;

  const { hours: hour, minutes: minute } = parseTime(timeStr);
  const timeMinutes = hour * 60 + minute;

  for (const period of hours.periods) {
    const startParts = parseTime(period.start);
    const endParts = parseTime(period.end);
    const startMinutes = startParts.hours * 60 + startParts.minutes;
    const endMinutes = endParts.hours * 60 + endParts.minutes;

    // Check if time falls within this period (start inclusive, end exclusive for slots)
    if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
      return true;
    }
  }

  return false;
}

// Height of each slot in pixels (for calendar rendering)
export const SLOT_HEIGHT_PX = 80;

// Convert time string to minutes since midnight
export function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

// Calculate appointment height in pixels based on duration
export function getAppointmentHeight(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  // Height = (duration / slot duration) * slot height
  return (durationMinutes / SLOT_DURATION_MINUTES) * SLOT_HEIGHT_PX;
}

// Calculate how many slots an appointment spans
export function getAppointmentSlotSpan(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return Math.ceil(durationMinutes / SLOT_DURATION_MINUTES);
}
