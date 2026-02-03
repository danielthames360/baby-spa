// ============================================================
// API: /api/cash-register
// GET: List cash registers (ADMIN/OWNER)
// POST: Open cash register (RECEPTION)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";
import { CashRegisterStatus } from "@prisma/client";
import { z } from "zod";

const openCashRegisterSchema = z.object({
  initialFund: z.number().min(0, "El fondo inicial no puede ser negativo"),
});

// GET: List cash registers (ADMIN/OWNER only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and OWNER can list all cash registers
    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "No tienes permiso para ver arqueos" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as CashRegisterStatus | null;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [result, pendingCount] = await Promise.all([
      cashRegisterService.listCashRegisters({
        status: status || undefined,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        userId: userId || undefined,
        limit,
        offset,
      }),
      cashRegisterService.getPendingReviewCount(),
    ]);

    return NextResponse.json({
      ...result,
      pendingCount,
    });
  } catch (error) {
    console.error("Error listing cash registers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Open cash register (RECEPTION only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only RECEPTION needs to open cash register
    if (session.user.role !== "RECEPTION") {
      return NextResponse.json(
        { error: "Solo recepción necesita abrir caja" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validation = openCashRegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const cashRegister = await cashRegisterService.openCashRegister({
      userId: session.user.id,
      initialFund: validation.data.initialFund,
    });

    return NextResponse.json(cashRegister, { status: 201 });
  } catch (error) {
    console.error("Error opening cash register:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
