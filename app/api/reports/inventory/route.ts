import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
} from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";
import { inventoryReportSchema } from "@/lib/validations/report";

// GET /api/reports/inventory?filter=all
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN", "RECEPTION"]);

    const { searchParams } = new URL(request.url);

    const { filter } = validateRequest(
      {
        filter: searchParams.get("filter") || "all",
      },
      inventoryReportSchema
    );

    const items = await reportService.getInventoryReport(filter);

    // Calculate summary
    const summary = {
      total: items.length,
      ok: items.filter((i) => i.status === "ok").length,
      lowStock: items.filter((i) => i.status === "low").length,
      outOfStock: items.filter((i) => i.status === "out").length,
      totalValue: items.reduce((sum, i) => sum + i.costPrice * i.currentStock, 0),
    };

    return successResponse({
      items: items.map((i) => ({
        ...i,
        lastMovementDate: i.lastMovementDate?.toISOString() || null,
      })),
      summary,
    });
  } catch (error) {
    return handleApiError(error, "getting inventory report");
  }
}
