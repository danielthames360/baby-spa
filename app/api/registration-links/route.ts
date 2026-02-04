import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createRegistrationLinkSchema } from "@/lib/validations/registration";

// Generate a unique token for registration links
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars (I/1, O/0)
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST /api/registration-links - Create a new registration link (staff only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and RECEPTION can create registration links
    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createRegistrationLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { parentPhone, locale } = validation.data;

    // Generate unique token
    let token = generateToken();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.registrationLink.findUnique({
        where: { token },
      });
      if (!existing) break;
      token = generateToken();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Could not generate unique token" },
        { status: 500 }
      );
    }

    // Create registration link (expires in 5 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    const registrationLink = await prisma.registrationLink.create({
      data: {
        token,
        parentPhone,
        expiresAt,
        createdById: session.user.id,
      },
    });

    // Build the full URL with locale parameter
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const langParam = locale ? `?lang=${locale}` : "";
    const fullUrl = `${baseUrl}/registro/${token}${langParam}`;

    return NextResponse.json({
      link: registrationLink,
      url: fullUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating registration link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/registration-links - List registration links (staff only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "ADMIN", "RECEPTION"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all"; // all, used, pending, expired
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const now = new Date();

    // Build where clause based on status
    const where: {
      isUsed?: boolean;
      expiresAt?: { gte?: Date; lt?: Date };
    } = {};

    if (status === "used") {
      where.isUsed = true;
    } else if (status === "pending") {
      where.isUsed = false;
      where.expiresAt = { gte: now };
    } else if (status === "expired") {
      where.isUsed = false;
      where.expiresAt = { lt: now };
    }

    const [links, total] = await Promise.all([
      prisma.registrationLink.findMany({
        where,
        include: {
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registrationLink.count({ where }),
    ]);

    return NextResponse.json({
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing registration links:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
