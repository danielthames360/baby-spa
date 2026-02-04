import { NextRequest } from "next/server";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { activityService } from "@/lib/services/activity-service";
import { ActivityType } from "@prisma/client";

/**
 * GET /api/activity
 * List activities with filters (ADMIN only)
 * Query params:
 *   - types: comma-separated ActivityType values
 *   - performedById: string - filter by user who performed the action
 *   - from: string (YYYY-MM-DD) - start date
 *   - to: string (YYYY-MM-DD) - end date
 *   - page: number (default: 1)
 *   - limit: number (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Only OWNER/ADMIN can view activity log
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);

    // Parse types filter
    const typesParam = searchParams.get("types");
    const types = typesParam
      ? (typesParam.split(",") as ActivityType[])
      : undefined;

    // Parse other filters
    const performedById = searchParams.get("performedById") || undefined;

    // Parse date range
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const from = fromParam ? new Date(fromParam + "T00:00:00") : undefined;
    const to = toParam ? new Date(toParam + "T23:59:59") : undefined;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await activityService.list({
      types,
      performedById,
      from,
      to,
      page,
      limit,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error, "listing activities");
  }
}
