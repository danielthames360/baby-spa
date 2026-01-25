import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z, ZodSchema } from "zod";

// Custom API Error class for consistent error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    public details?: unknown
  ) {
    super(errorCode);
    this.name = "ApiError";
  }
}

// All possible user roles
export type UserRole = "ADMIN" | "RECEPTION" | "THERAPIST" | "PARENT";

// Type for session with user info
export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

/**
 * Authenticate request and return session
 * Throws ApiError if unauthorized
 */
export async function withAuth(
  allowedRoles?: UserRole[]
): Promise<AuthSession> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    throw new ApiError(403, "Forbidden");
  }

  return session as AuthSession;
}

/**
 * Validate request body against a Zod schema
 * Throws ApiError if validation fails
 */
export function validateRequest<T>(data: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ApiError(400, "VALIDATION_ERROR", result.error.issues);
  }

  return result.data;
}

/**
 * Handle API errors consistently
 * Returns appropriate NextResponse based on error type
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log error with context
  if (context) {
    console.error(`Error ${context}:`, error);
  } else {
    console.error("API Error:", error);
  }

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.errorCode,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: error.issues },
      { status: 400 }
    );
  }

  // Handle known error messages
  if (error instanceof Error) {
    const knownErrors: Record<string, number> = {
      // Not found errors
      APPOINTMENT_NOT_FOUND: 404,
      BABY_NOT_FOUND: 404,
      PARENT_NOT_FOUND: 404,
      SESSION_NOT_FOUND: 404,
      PACKAGE_NOT_FOUND: 404,
      PRODUCT_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      PACKAGE_PURCHASE_NOT_FOUND: 404,
      SESSION_PRODUCT_NOT_FOUND: 404,

      // Bad request errors
      APPOINTMENT_NOT_SCHEDULED: 400,
      APPOINTMENT_PENDING_PAYMENT: 400,
      SESSION_ALREADY_EXISTS: 400,
      SESSION_ALREADY_COMPLETED: 400,
      SESSION_NOT_STARTED: 400,
      SESSION_NOT_IN_PROGRESS: 400,
      EVALUATION_ALREADY_EXISTS: 400,
      INVALID_THERAPIST: 400,
      PACKAGE_NOT_FOR_THIS_BABY: 400,
      NO_SESSIONS_REMAINING: 400,
      PACKAGE_NO_REMAINING_SESSIONS: 400,
      INSUFFICIENT_STOCK: 400,
      PHONE_EXISTS: 400,
      AT_LEAST_ONE_PARENT: 400,
      BIRTH_DATE_TOO_OLD: 400,
      MISSING_REQUIRED_FIELDS: 400,
      INVALID_AMOUNT: 400,
      INVALID_PAYMENT_METHOD: 400,
      INVALID_PAYMENT_TYPE: 400,
      AMOUNT_BELOW_MINIMUM: 400,
      INSTALLMENT_ALREADY_PAID: 400,
      INVALID_INSTALLMENT_NUMBER: 400,
      INVALID_INSTALLMENT_AMOUNT: 400,
      PACKAGE_PAYMENT_NOT_FOUND: 404,
      CAN_ONLY_DELETE_LATEST_PAYMENT: 400,
    };

    const statusCode = knownErrors[error.message];
    if (statusCode) {
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }
  }

  // Default: Internal server error
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Created response helper (201)
 */
export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}
