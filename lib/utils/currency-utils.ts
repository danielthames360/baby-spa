/**
 * Currency utility functions
 * Centralizes currency formatting based on locale
 */

/**
 * Get the currency symbol for a given locale
 * - pt-BR: R$ (Brazilian Real)
 * - es: Bs. (Bolivianos)
 */
export function getCurrencySymbol(locale: string): string {
  return locale === "pt-BR" ? "R$" : "Bs.";
}

/**
 * Format an amount with the appropriate currency symbol and thousand separators
 * Examples:
 * - formatCurrency(525420, "es") => "Bs. 525,420.00"
 * - formatCurrency(1234567.89, "pt-BR") => "R$ 1.234.567,89"
 */
export function formatCurrency(amount: number, locale: string): string {
  const symbol = getCurrencySymbol(locale);

  // Use locale-specific formatting
  // pt-BR uses . for thousands and , for decimals
  // es (Bolivia) uses , for thousands and . for decimals
  const localeCode = locale === "pt-BR" ? "pt-BR" : "es-BO";

  const formatted = amount.toLocaleString(localeCode, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formatted}`;
}

/**
 * Format a number with thousand separators (no currency symbol)
 * Examples:
 * - formatNumber(525420, "es") => "525,420"
 * - formatNumber(1234567, "pt-BR") => "1.234.567"
 */
export function formatNumber(value: number, locale: string): string {
  const localeCode = locale === "pt-BR" ? "pt-BR" : "es-BO";
  return value.toLocaleString(localeCode);
}

/**
 * Format a percentage with locale-specific decimal separator
 * Examples:
 * - formatPercent(39.5, "es") => "39.5%"
 * - formatPercent(39.5, "pt-BR") => "39,5%"
 */
export function formatPercent(value: number, locale: string, decimals: number = 1): string {
  const localeCode = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const formatted = value.toLocaleString(localeCode, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted}%`;
}
