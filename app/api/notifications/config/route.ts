import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/notifications/config - Get notification configuration
// This endpoint returns the polling interval for the frontend
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only allow staff members (OWNER, ADMIN, RECEPTION, THERAPIST)
    if (!session || !["OWNER", "ADMIN", "RECEPTION", "THERAPIST"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: {
        notificationPollingInterval: true,
      },
    });

    // Return default values if settings don't exist
    return NextResponse.json({
      pollingInterval: settings?.notificationPollingInterval ?? 5,
    });
  } catch (error) {
    console.error("Error fetching notification config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
