// ============================================================
// API: /api/cash-register/[id]/close
// POST: Close cash register (RECEPTION)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const closeSchema = z.object({
  declaredAmount: z.number().min(0, "El monto declarado no puede ser negativo"),
  closingNotes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECEPTION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = closeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const cashRegister = await cashRegisterService.closeCashRegister({
      cashRegisterId: id,
      userId: session.user.id,
      declaredAmount: validation.data.declaredAmount,
      closingNotes: validation.data.closingNotes,
    });

    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error("Error closing cash register:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
