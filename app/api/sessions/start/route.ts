import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session-service";
import { z } from "zod";

const startSessionSchema = z.object({
  appointmentId: z.string().min(1),
  therapistId: z.string().min(1),
  packagePurchaseId: z.string().optional().nullable(), // Existing package purchase to use
  packageId: z.string().optional().nullable(), // Catalog package selected (provisional)
});

// POST /api/sessions/start - Start a session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can start sessions
    if (!["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = startSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { appointmentId, therapistId, packagePurchaseId, packageId } = validationResult.data;

    const result = await sessionService.startSession({
      appointmentId,
      therapistId,
      packagePurchaseId: packagePurchaseId || null,
      packageId: packageId || null,
      userId: session.user.id,
      userName: session.user.name || "Unknown",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error starting session:", error);

    if (error instanceof Error) {
      const errorMap: Record<string, { message: string; status: number }> = {
        APPOINTMENT_NOT_FOUND: { message: "APPOINTMENT_NOT_FOUND", status: 404 },
        APPOINTMENT_NOT_SCHEDULED: {
          message: "APPOINTMENT_NOT_SCHEDULED",
          status: 400,
        },
        APPOINTMENT_PENDING_PAYMENT: {
          message: "APPOINTMENT_PENDING_PAYMENT",
          status: 400,
        },
        SESSION_ALREADY_EXISTS: {
          message: "SESSION_ALREADY_EXISTS",
          status: 400,
        },
        INVALID_THERAPIST: { message: "INVALID_THERAPIST", status: 400 },
        PACKAGE_PURCHASE_NOT_FOUND: {
          message: "PACKAGE_PURCHASE_NOT_FOUND",
          status: 404,
        },
        PACKAGE_NOT_FOR_THIS_BABY: {
          message: "PACKAGE_NOT_FOR_THIS_BABY",
          status: 400,
        },
        PACKAGE_NOT_FOR_THIS_PARENT: {
          message: "PACKAGE_NOT_FOR_THIS_PARENT",
          status: 400,
        },
        NO_SESSIONS_REMAINING: {
          message: "NO_SESSIONS_REMAINING",
          status: 400,
        },
      };

      const mappedError = errorMap[error.message];
      if (mappedError) {
        return NextResponse.json(
          { error: mappedError.message },
          { status: mappedError.status }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
