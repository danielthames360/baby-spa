import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  successResponse,
  ApiError,
} from "@/lib/api-utils";
import { expenseService } from "@/lib/services/expense-service";
import { updateExpenseSchema } from "@/lib/validations/expense";
import { ExpenseCategory } from "@prisma/client";
import { fromDateOnly } from "@/lib/utils/date-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/expenses/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    const expense = await expenseService.getById(id);

    if (!expense) {
      throw new ApiError(404, "EXPENSE_NOT_FOUND");
    }

    // Serialize decimals
    const serialized = {
      ...expense,
      amount: Number(expense.amount),
      expenseDate: fromDateOnly(expense.expenseDate),
      paymentDetails: expense.paymentDetails.map((d) => ({
        ...d,
        amount: Number(d.amount),
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "getting expense");
  }
}

// PATCH /api/expenses/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const data = validateRequest(body, updateExpenseSchema);

    const result = await expenseService.update(id, {
      ...data,
      category: data.category as ExpenseCategory | undefined,
    });

    // Serialize decimals
    const serialized = {
      ...result,
      amount: Number(result.amount),
      expenseDate: fromDateOnly(result.expenseDate),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "updating expense");
  }
}

// DELETE /api/expenses/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await withAuth(["OWNER", "ADMIN"]);

    const { id } = await params;
    const result = await expenseService.delete(id, session.user.id);

    // Serialize decimals
    const serialized = {
      ...result,
      amount: Number(result.amount),
      expenseDate: fromDateOnly(result.expenseDate),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "deleting expense");
  }
}
