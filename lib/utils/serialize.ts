/**
 * Serialization utilities for React Server Components
 *
 * Prisma returns special objects (Decimal, Date) that aren't JSON-serializable.
 * Use these utilities to convert data before passing to Client Components.
 */

/**
 * Check if a value is a Prisma Decimal object
 * Works regardless of Prisma version by checking for toNumber method
 * Note: Constructor name may be "Decimal" or "Decimal2" depending on bundler
 */
function isDecimal(value: unknown): value is { toNumber(): number } {
  if (value === null || typeof value !== "object") {
    return false;
  }
  // Check by duck typing - has toNumber, s (sign), d (digits), e (exponent)
  const obj = value as Record<string, unknown>;
  return (
    "toNumber" in obj &&
    typeof obj.toNumber === "function" &&
    "s" in obj &&
    "d" in obj &&
    "e" in obj
  );
}

/**
 * Recursively serialize an object, converting:
 * - Decimal → number
 * - Date → ISO string
 * - Nested objects and arrays
 *
 * @param obj - Any object from Prisma
 * @returns Plain JSON-serializable object
 */
export function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Decimal (check by constructor name to avoid import issues)
  if (isDecimal(obj)) {
    return obj.toNumber() as T;
  }

  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString() as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeForClient) as T;
  }

  // Handle Objects
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeForClient(value);
    }
    return result as T;
  }

  // Primitives (string, number, boolean) pass through
  return obj;
}

/**
 * Quick serialization using JSON.parse/stringify
 * Less type-safe but simpler for complex nested objects
 *
 * @param obj - Any object
 * @returns Plain JSON-serializable object
 */
export function quickSerialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) => {
    // Handle Decimal objects
    if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
      return Number(value);
    }
    return value;
  }));
}
