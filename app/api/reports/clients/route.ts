import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";
import { reportService } from "@/lib/services/report-service";

export async function GET() {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const report = await reportService.getClientPortfolio();
    return successResponse(report);
  } catch (error) {
    return handleApiError(error, "getting client portfolio");
  }
}
