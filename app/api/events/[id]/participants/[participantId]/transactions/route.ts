import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, handleApiError, successResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    await withAuth(["OWNER", "ADMIN"]);
    const { participantId } = await params;

    const transactions = await prisma.transaction.findMany({
      where: {
        referenceId: participantId,
        category: { in: ["EVENT_REGISTRATION", "EVENT_PRODUCTS"] },
      },
      select: {
        id: true,
        category: true,
        total: true,
        createdAt: true,
        isReversal: true,
        voidedAt: true,
        voidReason: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = transactions.map((t) => ({
      ...t,
      total: Number(t.total),
    }));

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "fetching participant transactions");
  }
}
