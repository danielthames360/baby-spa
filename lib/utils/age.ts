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
 * @param birthDate - Date of birth (Date object or string)
 * @returns AgeResult object with detailed age breakdown
 */
export function calculateExactAge(birthDate: Date | string): AgeResult {
  const birth = new Date(birthDate);
  const now = new Date();

  // Calculate total months
  let totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  // Adjust if current day is before birth day
  if (now.getDate() < birth.getDate()) {
    totalMonths--;
  }

  // Handle edge case of negative months (birth date in future)
  if (totalMonths < 0) totalMonths = 0;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  // Calculate remaining days
  let days: number;
  if (totalMonths < 1) {
    // Less than a month - just count days
    days = Math.floor(
      (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) days = 0;
  } else {
    // Calculate days since last month anniversary
    const lastMonthAnniversary = new Date(
      now.getFullYear(),
      now.getMonth(),
      birth.getDate()
    );

    // If the anniversary hasn't happened this month yet, go back a month
    if (lastMonthAnniversary > now) {
      lastMonthAnniversary.setMonth(lastMonthAnniversary.getMonth() - 1);
    }

    days = Math.floor(
      (now.getTime() - lastMonthAnniversary.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) days = 0;
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
