import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { expenseService } from "@/lib/services/expense-service";
import { ExpenseCategory, UserRole } from "@prisma/client";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseSummary } from "@/components/expenses/expense-summary";
import { fromDateOnly } from "@/lib/utils/date-utils";
import { hasPermission } from "@/lib/permissions";

interface ExpensesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function ExpensesPage({
  params,
  searchParams,
}: ExpensesPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // OWNER, ADMIN, and RECEPTION can access this page
  const userRole = session.user.role as UserRole;
  if (!["OWNER", "ADMIN", "RECEPTION"].includes(userRole)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  // Check if user can view all expenses (OWNER/ADMIN only)
  const canViewAll = hasPermission(userRole, "expenses:view-all");

  const t = await getTranslations("expenses");
  const resolvedSearchParams = await searchParams;

  // Parse filters from URL
  const category = resolvedSearchParams.category as ExpenseCategory | undefined;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  // Default to current month if no date range
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const from = resolvedSearchParams.from
    ? new Date(resolvedSearchParams.from + "T00:00:00")
    : defaultFrom;
  const to = resolvedSearchParams.to
    ? new Date(resolvedSearchParams.to + "T23:59:59")
    : defaultTo;

  // Fetch expenses and summary in parallel
  const [expensesResult, summaryByCategory, total] = await Promise.all([
    expenseService.list({
      category,
      from,
      to,
      page,
      limit: 20,
    }),
    expenseService.getSummaryByCategory(from, to),
    expenseService.getTotal(from, to),
  ]);

  // Serialize for client components
  const expenses = expensesResult.expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    reference: e.reference,
    expenseDate: fromDateOnly(e.expenseDate),
    createdAt: e.createdAt.toISOString(),
    deletedAt: e.deletedAt?.toISOString() || null,
    createdBy: {
      id: e.createdBy.id,
      name: e.createdBy.name,
    },
  }));
  const pagination = expensesResult.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {canViewAll ? t("subtitle") : t("subtitleReception")}
          </p>
        </div>
        <ExpenseDialog
          locale={locale}
          trigger={
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:shadow-xl hover:shadow-teal-300/50">
              {t("newExpense")}
            </button>
          }
        />
      </div>

      {/* Summary - Only for users who can view all */}
      {canViewAll && (
        <ExpenseSummary
          summaryByCategory={summaryByCategory}
          total={total}
          locale={locale}
        />
      )}

      {/* Filters - Only for users who can view all */}
      {canViewAll && (
        <ExpenseFilters
          locale={locale}
          initialFilters={{
            category: resolvedSearchParams.category,
            from: resolvedSearchParams.from || fromDateOnly(defaultFrom),
            to: resolvedSearchParams.to || fromDateOnly(defaultTo),
          }}
        />
      )}

      {/* Expenses List - Only for users who can view all */}
      {canViewAll && (
        <ExpenseList
          expenses={expenses}
          pagination={pagination}
          locale={locale}
          emptyMessage={t("empty")}
        />
      )}

      {/* Message for RECEPTION users */}
      {!canViewAll && (
        <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-sm">
          <p className="text-gray-600">{t("receptionMessage")}</p>
        </div>
      )}
    </div>
  );
}
