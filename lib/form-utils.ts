/**
 * Shared form utility functions
 * Used across baby-form, parent-form, and other form components
 */

/**
 * Translate Zod error messages to localized strings
 * @param error - The error message key from Zod validation
 * @param t - Translation function from useTranslations
 * @param namespace - Translation namespace (default: "common.errors")
 */
export function translateError(
  error: string | undefined,
  t: (key: string) => string,
  namespace: string = "common.errors"
): string {
  if (!error) return "";

  // If error contains underscore, it's likely a translation key
  if (error.includes("_")) {
    // Try to translate the error key
    const translated = t(`${namespace}.${error}`);
    // If translation returns the key itself, try without namespace
    if (translated === `${namespace}.${error}`) {
      return t(error);
    }
    return translated;
  }

  return error;
}

/**
 * Safely convert any value to string for form inputs
 * Handles null, undefined, numbers, and other types
 */
export function getStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/**
 * Safely convert any value to number for form inputs
 * Returns undefined for invalid/empty values
 */
export function getNumberValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? undefined : num;
}

/**
 * Convert value to ISO date string for date inputs
 * Handles Date objects, strings, and timestamps
 */
export function getDateValue(value: unknown): string {
  if (!value) return "";

  try {
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }
    if (typeof value === "string") {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      // Parse and convert
      return new Date(value).toISOString().split("T")[0];
    }
    if (typeof value === "number") {
      return new Date(value).toISOString().split("T")[0];
    }
  } catch {
    // Invalid date
  }

  return "";
}

/**
 * Convert boolean-like values to boolean
 * Handles "true"/"false" strings, 1/0, etc.
 */
export function getBooleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return false;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Trim string value, return undefined if empty
 * Useful for optional string fields
 */
export function trimOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return undefined;
}
