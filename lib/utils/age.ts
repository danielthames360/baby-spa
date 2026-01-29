/**
 * Age calculation utility for Baby Spa
 * Provides unified age calculation with i18n support
 */

export interface AgeResult {
  /** Total months since birth */
  totalMonths: number;
  /** Full years */
  years: number;
  /** Remaining months after years */
  months: number;
  /** Remaining days after months */
  days: number;
}

/**
 * Calculate exact age from birth date
 * Uses pure date arithmetic (no timestamps) to avoid timezone issues.
 * Birth dates are stored at UTC noon, so we use UTC methods for birth date
 * and local date for "today" to get accurate day counts.
 *
 * @param birthDate - Date of birth (Date object or string)
 * @returns AgeResult object with detailed age breakdown
 */
export function calculateExactAge(birthDate: Date | string): AgeResult {
  const birth = new Date(birthDate);
  const now = new Date();

  // Extract date components only (no time/timezone issues)
  // Birth date: use UTC because dates are stored at UTC noon (12:00:00Z)
  const birthYear = birth.getUTCFullYear();
  const birthMonth = birth.getUTCMonth();
  const birthDay = birth.getUTCDate();

  // Today: use local date
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  // Calculate total months
  let totalMonths = (nowYear - birthYear) * 12 + (nowMonth - birthMonth);

  // Adjust if current day is before birth day in the month
  if (nowDay < birthDay) {
    totalMonths--;
  }

  // Handle edge case of negative months (birth date in future)
  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  // Calculate remaining days using pure arithmetic (no timestamps)
  let days: number;
  if (totalMonths < 1) {
    // Less than a month - count days directly
    // Create dates at midnight for accurate day count
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    const todayDate = new Date(nowYear, nowMonth, nowDay);
    days = Math.round((todayDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) days = 0;
  } else {
    // Calculate days since last month anniversary
    if (nowDay >= birthDay) {
      // Anniversary already passed this month
      days = nowDay - birthDay;
    } else {
      // Anniversary hasn't happened yet - count from last month
      // Get the number of days in the previous month
      const lastMonth = nowMonth === 0 ? 11 : nowMonth - 1;
      const lastMonthYear = nowMonth === 0 ? nowYear - 1 : nowYear;
      const daysInLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate();

      // Days from birth day to end of last month + days into current month
      days = (daysInLastMonth - birthDay) + nowDay;
    }
  }

  return { totalMonths, years, months, days };
}

/**
 * Format age with full localized text using i18n
 * @param age - AgeResult from calculateExactAge
 * @param t - Translation function from next-intl
 * @returns Formatted age string (e.g., "2 meses y 12 días")
 */
export function formatAge(
  age: AgeResult,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  // Less than a month - show days
  if (age.totalMonths < 1) {
    if (age.days === 0) {
      return t("age.newborn");
    }
    return t("age.days", { count: age.days });
  }

  // Less than a year - show months and days
  if (age.years === 0) {
    if (age.days === 0) {
      return t("age.months", { count: age.months });
    }
    return t("age.monthsAndDays", { months: age.months, days: age.days });
  }

  // 1 year or more - show years and months
  if (age.months === 0) {
    if (age.years === 1) {
      return t("age.years", { count: 1 });
    }
    return t("age.yearsPlural", { count: age.years });
  }

  // Years and months
  if (age.years === 1) {
    return t("age.yearsAndMonths", { years: 1, months: age.months });
  }
  return t("age.yearsAndMonthsPlural", { years: age.years, months: age.months });
}

/**
 * Format age in compact form for badges (e.g., "2m 12d", "1a 3m")
 * @param age - AgeResult from calculateExactAge
 * @param t - Translation function from next-intl
 * @returns Compact formatted age string
 */
export function formatAgeShort(
  age: AgeResult,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  // Less than a month - show days
  if (age.totalMonths < 1) {
    if (age.days === 0) {
      return t("age.newborn");
    }
    return t("age.dayShort", { count: age.days });
  }

  // Less than a year - show months (optionally with days)
  if (age.years === 0) {
    if (age.days === 0) {
      return t("age.monthShort", { count: age.months });
    }
    return `${t("age.monthShort", { count: age.months })} ${t("age.dayShort", { count: age.days })}`;
  }

  // 1 year or more - show years and months
  if (age.months === 0) {
    return t("age.yearShort", { count: age.years });
  }

  return `${t("age.yearShort", { count: age.years })} ${t("age.monthShort", { count: age.months })}`;
}

/**
 * Check if baby is eligible for Baby Spa services (0-36 months)
 * @param birthDate - Date of birth
 * @returns true if baby is 36 months or younger
 */
export function isBabyEligible(birthDate: Date | string): boolean {
  const age = calculateExactAge(birthDate);
  return age.totalMonths <= 36;
}

/**
 * Check if today is a "mesversario" (monthly birthday) for a baby
 * A mesversario occurs when today's day matches the birth day (exactly N months old)
 *
 * @param birthDate - Date of birth (Date object or ISO string)
 * @returns true if today is the baby's monthly birthday
 *
 * @example
 * // Baby born on January 15th
 * // On February 15th: isMesversario returns true (1 month exactly)
 * // On February 16th: isMesversario returns false
 */
export function isMesversario(birthDate: Date | string): boolean {
  const age = calculateExactAge(birthDate);
  // Es mesversario cuando los días restantes son 0 (exactamente N meses)
  return age.days === 0;
}
