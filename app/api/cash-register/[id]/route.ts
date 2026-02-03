// ============================================================
// API: /api/cash-register/[id]
// GET: Get cash register detail (ADMIN/OWNER)
// ============================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const cashRegister = await cashRegisterService.getCashRegisterDetail(id);

    if (!cashRegister) {
      return NextResponse.json(
        { error: "Arqueo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error("Error getting cash register detail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
