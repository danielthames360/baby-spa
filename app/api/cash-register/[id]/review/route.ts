// ============================================================
// API: /api/cash-register/[id]/review
// POST: Review/approve cash register (ADMIN/OWNER)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const reviewSchema = z.object({
  reviewNotes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const cashRegister = await cashRegisterService.reviewCashRegister({
      cashRegisterId: id,
      reviewerId: session.user.id,
      reviewNotes: validation.data.reviewNotes,
      reviewedByRole: session.user.role,
    });

    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error("Error reviewing cash register:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
