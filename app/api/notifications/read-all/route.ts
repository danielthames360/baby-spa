import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { notificationService } from "@/lib/services/notification-service";
import { UserRole } from "@prisma/client";

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications as read for the current user's role
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    // OWNER/ADMIN marks all notifications as read, RECEPTION only their own
    const forRole = ["OWNER", "ADMIN"].includes(session.user.role)
      ? undefined
      : (session.user.role as UserRole);

    const result = await notificationService.markAllAsRead(
      session.user.id,
      forRole
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "marking all notifications as read");
  }
}
