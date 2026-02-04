import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  createdResponse,
  successResponse,
} from "@/lib/api-utils";
import { expenseService } from "@/lib/services/expense-service";
import {
  createExpenseSchema,
  listExpensesSchema,
} from "@/lib/validations/expense";
import { ExpenseCategory } from "@prisma/client";
import { fromDateOnly } from "@/lib/utils/date-utils";

// GET /api/expenses
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER", "ADMIN"]);

    const { searchParams } = new URL(request.url);
    const filters = validateRequest(
      {
        category: searchParams.get("category") || undefined,
        categories: searchParams.get("categories")?.split(",").filter(Boolean) || undefined,
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
        includeDeleted: searchParams.get("includeDeleted") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      },
      listExpensesSchema
    );

    // Parse dates
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;

    const result = await expenseService.list({
      ...filters,
      category: filters.category as ExpenseCategory | undefined,
      categories: filters.categories as ExpenseCategory[] | undefined,
      from,
      to,
    });

    // Serialize decimals for client
    const serialized = {
      ...result,
      expenses: result.expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        expenseDate: fromDateOnly(e.expenseDate),
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "listing expenses");
  }
}

// POST /api/expenses
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER", "ADMIN"]);

    const body = await request.json();
    const data = validateRequest(body, createExpenseSchema);

    const result = await expenseService.create({
      ...data,
      category: data.category as ExpenseCategory,
      createdById: session.user.id,
    });

    // Serialize decimals
    const serialized = {
      ...result,
      amount: Number(result.amount),
      expenseDate: fromDateOnly(result.expenseDate),
    };

    return createdResponse(serialized);
  } catch (error) {
    return handleApiError(error, "creating expense");
  }
}
