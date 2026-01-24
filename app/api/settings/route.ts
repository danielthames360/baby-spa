import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Retrieve system settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create system settings
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      include: {
        defaultPackage: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            duration: true,
          },
        },
      },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
        },
        include: {
          defaultPackage: {
            select: {
              id: true,
              name: true,
              sessionCount: true,
              duration: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      defaultPackageId,
      paymentQrImage,
      whatsappNumber,
      whatsappCountryCode,
      whatsappMessage,
    } = body;

    // Validate QR image size if provided (max 2MB for base64)
    if (paymentQrImage && paymentQrImage.length > 2 * 1024 * 1024 * 1.37) {
      return NextResponse.json(
        { error: "QR_IMAGE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // Validate WhatsApp number format if provided
    if (whatsappNumber && !/^\d{6,15}$/.test(whatsappNumber.replace(/\D/g, ""))) {
      return NextResponse.json(
        { error: "INVALID_WHATSAPP_NUMBER" },
        { status: 400 }
      );
    }

    // Update or create settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        defaultPackageId,
        paymentQrImage,
        whatsappNumber,
        whatsappCountryCode: whatsappCountryCode || "+591",
        whatsappMessage,
      },
      update: {
        ...(defaultPackageId !== undefined && { defaultPackageId }),
        ...(paymentQrImage !== undefined && { paymentQrImage }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(whatsappCountryCode !== undefined && { whatsappCountryCode }),
        ...(whatsappMessage !== undefined && { whatsappMessage }),
      },
      include: {
        defaultPackage: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            duration: true,
          },
        },
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
