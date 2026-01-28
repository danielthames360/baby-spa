import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { notificationService } from "@/lib/services/notification-service";
import { UserRole } from "@prisma/client";

/**
 * GET /api/notifications
 * List notifications for the current user's role
 * Query params:
 *   - unread: boolean - only show unread notifications
 *   - limit: number - max notifications to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await withAuth(["ADMIN", "RECEPTION"]);
    const { searchParams } = new URL(request.url);

    const unread = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // ADMIN sees all notifications, RECEPTION only sees their own
    const forRole = session.user.role === "ADMIN"
      ? undefined
      : (session.user.role as UserRole);

    const result = await notificationService.list({
      unread: unread || undefined,
      forRole,
      limit,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "listing notifications");
  }
}
