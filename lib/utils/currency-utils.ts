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
 * Format an amount with the appropriate currency symbol
 */
export function formatCurrency(amount: number, locale: string): string {
  const symbol = getCurrencySymbol(locale);
  const formatted = amount.toFixed(2);
  return `${symbol} ${formatted}`;
}
