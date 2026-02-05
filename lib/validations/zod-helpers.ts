import { z } from "zod";

/**
 * Zod helper for parsing optional boolean values from query strings.
 *
 * The standard z.coerce.boolean() doesn't work correctly for query params
 * because it converts any non-empty string to `true` (including "false").
 *
 * This helper correctly parses:
 * - undefined → undefined
 * - "" (empty string) → undefined
 * - "true" → true
 * - "false" → false
 *
 * @example
 * // In a schema for query params:
 * const schema = z.object({
 *   hasActivePackage: optionalBooleanFromString,
 *   includeDeleted: optionalBooleanFromString,
 * });
 */
export const optionalBooleanFromString = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined || val === "") return undefined;
    return val === "true";
  });
