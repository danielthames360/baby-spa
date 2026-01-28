import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { notificationService } from "@/lib/services/notification-service";
import { UserRole } from "@prisma/client";

/**
 * GET /api/notifications/count
 * Get count of unread notifications and last created timestamp
 * This is a lightweight endpoint for polling
 */
export async function GET(request: NextRequest) {
  try {
    const session = await withAuth(["ADMIN", "RECEPTION"]);

    // ADMIN sees all notifications, RECEPTION only sees their own
    const forRole = session.user.role === "ADMIN"
      ? undefined
      : (session.user.role as UserRole);

    const result = await notificationService.getCount(forRole);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "getting notification count");
  }
}
