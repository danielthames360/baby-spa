import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { notificationService } from "@/lib/services/notification-service";
import { UserRole } from "@prisma/client";

/**
 * GET /api/notifications/count
 * Get count of unread notifications and last created timestamp
 * This is a lightweight endpoint for polling
 */
export async function GET() {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    // OWNER/ADMIN sees all notifications, RECEPTION only sees their own
    const forRole = ["OWNER", "ADMIN"].includes(session.user.role)
      ? undefined
      : (session.user.role as UserRole);

    const result = await notificationService.getCount(forRole);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "getting notification count");
  }
}
