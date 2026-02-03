// ============================================================
// API: /api/cash-register/expenses
// POST: Add expense to current open cash register (RECEPTION)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cashRegisterService } from "@/lib/services/cash-register-service";
import { CashExpenseCategory } from "@prisma/client";
import { z } from "zod";

const expenseSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a 0"),
  category: z.nativeEnum(CashExpenseCategory),
  description: z.string().min(1, "La descripción es obligatoria"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECEPTION") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const validation = expenseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get current open cash register for this user
    const cashRegister = await cashRegisterService.getCurrentCashRegister(
      session.user.id
    );

    if (!cashRegister) {
      return NextResponse.json(
        { error: "No tienes una caja abierta" },
        { status: 400 }
      );
    }

    const expense = await cashRegisterService.addCashRegisterExpense({
      cashRegisterId: cashRegister.id,
      userId: session.user.id,
      amount: validation.data.amount,
      category: validation.data.category,
      description: validation.data.description,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error adding cash register expense:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
