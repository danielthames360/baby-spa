import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse, ApiError } from "@/lib/api-utils";
import { notificationService } from "@/lib/services/notification-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]/read
 * Mark a single notification as read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await withAuth(["OWNER", "ADMIN", "RECEPTION"]);
    const { id } = await params;

    // Verify notification exists
    const notification = await notificationService.getById(id);
    if (!notification) {
      throw new ApiError(404, "NOTIFICATION_NOT_FOUND");
    }

    const result = await notificationService.markAsRead(id, session.user.id);

    return successResponse({ success: true, notification: result });
  } catch (error) {
    return handleApiError(error, "marking notification as read");
  }
}
