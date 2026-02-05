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

  // Queries básicas para todos los roles con permiso de operaciones
  const [todayAppointments, pendingCheckouts, activeClients, registeredBabies] =
    await Promise.all([
      // Citas de hoy
      prisma.appointment.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"],
          },
        },
      }),
      // Sesiones pendientes de checkout
      prisma.session.count({
        where: {
          status: {
            in: ["PENDING", "EVALUATED"],
          },
        },
      }),
      // Clientes activos (padres con bebés)
      prisma.parent.count({
        where: {
          status: "ACTIVE",
        },
      }),
      // Bebés registrados activos
      prisma.baby.count({
        where: {
          isActive: true,
        },
      }),
    ]);

  const stats = {
    todayAppointments,
    pendingCheckouts,
    activeClients,
    registeredBabies,
    todayIncome: undefined as number | undefined,
    monthIncome: undefined as number | undefined,
    pendingPayments: undefined as number | undefined,
  };

  // Solo calcular finanzas si el rol tiene permiso
  if (hasPermission(userRole, "dashboard:view-finance")) {
    const [todayPayments, monthPayments, pendingPackages] = await Promise.all([
      // Ingresos de hoy (de Transaction con type INCOME)
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Ingresos del mes (de Transaction con type INCOME)
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Pagos pendientes de paquetes
      prisma.packagePurchase.aggregate({
        where: {
          isActive: true,
        },
        _sum: {
          totalPrice: true,
          paidAmount: true,
        },
      }),
    ]);

    stats.todayIncome = Number(todayPayments._sum?.total ?? 0);
    stats.monthIncome = Number(monthPayments._sum?.total ?? 0);

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
