import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoleDashboard } from "@/components/dashboard";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

async function getDashboardStats(userRole: UserRole) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Operation queries for all roles with operations permission
  const [todayAppointments, completedToday, pendingCheckouts, pendingEvaluations] =
    await Promise.all([
      // Today's scheduled + in-progress appointments
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
      }),
      // Appointments completed today
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: "COMPLETED",
        },
      }),
      // Sessions pending checkout
      prisma.session.count({
        where: {
          status: { in: ["PENDING", "EVALUATED"] },
        },
      }),
      // Sessions evaluated but not completed (last 7 days)
      prisma.session.count({
        where: {
          status: "EVALUATED",
          createdAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const stats = {
    todayAppointments,
    completedToday,
    pendingCheckouts,
    pendingEvaluations,
    todayIncome: undefined as number | undefined,
    todayExpenses: undefined as number | undefined,
    monthIncome: undefined as number | undefined,
    monthExpenses: undefined as number | undefined,
    pendingPayments: undefined as number | undefined,
  };

  // Only calculate finances if role has permission
  if (hasPermission(userRole, "dashboard:view-finance")) {
    const [
      todayIncomeAgg,
      monthIncomeAgg,
      todayExpensesAgg,
      monthExpensesAgg,
      todayStaffPaid,
      monthStaffPaid,
      pendingPackages,
    ] = await Promise.all([
      // Today's income (Transaction INCOME)
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { total: true },
      }),
      // Month's income (Transaction INCOME)
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      // Today's administrative expenses
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      // Month's administrative expenses
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startOfMonth },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      // Today's staff payments
      prisma.staffPayment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
        _sum: { netAmount: true },
      }),
      // Month's staff payments
      prisma.staffPayment.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: startOfMonth },
          deletedAt: null,
        },
        _sum: { netAmount: true },
      }),
      // Pending package payments (receivables)
      prisma.packagePurchase.aggregate({
        where: { isActive: true },
        _sum: { totalPrice: true, paidAmount: true },
      }),
    ]);

    stats.todayIncome = Number(todayIncomeAgg._sum?.total ?? 0);
    stats.monthIncome = Number(monthIncomeAgg._sum?.total ?? 0);
    stats.todayExpenses =
      Number(todayExpensesAgg._sum?.amount ?? 0) +
      Number(todayStaffPaid._sum?.netAmount ?? 0);
    stats.monthExpenses =
      Number(monthExpensesAgg._sum?.amount ?? 0) +
      Number(monthStaffPaid._sum?.netAmount ?? 0);

    const totalOwed = Number(pendingPackages._sum.totalPrice ?? 0);
    const totalPaid = Number(pendingPackages._sum.paidAmount ?? 0);
    stats.pendingPayments = totalOwed - totalPaid;
  }

  return stats;
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role as UserRole;
  const stats = await getDashboardStats(userRole);

  return (
    <RoleDashboard
      userRole={userRole}
      userName={session.user.name}
      stats={stats}
    />
  );
}
