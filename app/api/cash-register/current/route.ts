// ============================================================
// API: /api/cash-register/current
// GET: Get current open cash register for the user
// ============================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cashRegister = await cashRegisterService.getCurrentCashRegister(
      session.user.id
    );

    return NextResponse.json({ cashRegister });
  } catch (error) {
    console.error("Error getting current cash register:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
