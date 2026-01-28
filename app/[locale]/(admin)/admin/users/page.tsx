import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { userService } from "@/lib/services/user-service";
import { UserRole } from "@prisma/client";
import { UserList } from "@/components/users/user-list";
import { CreateUserButton } from "@/components/users/create-user-button";

interface UsersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    role?: string;
    isActive?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function UsersPage({
  params,
  searchParams,
}: UsersPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Only ADMIN can access this page
  if (session.user.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations("users");
  const resolvedSearchParams = await searchParams;

  // Parse filters from URL
  const role = resolvedSearchParams.role as UserRole | undefined;
  const isActive = resolvedSearchParams.isActive;
  const search = resolvedSearchParams.search || undefined;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  // Fetch users
  const result = await userService.list({
    role,
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    search,
    page,
    limit: 20,
  });

  // Serialize for client components
  const users = result.users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    isActive: u.isActive,
    baseSalary: u.baseSalary ? Number(u.baseSalary) : null,
    payFrequency: u.payFrequency,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    _count: u._count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <CreateUserButton locale={locale} />
      </div>

      {/* Users List */}
      <UserList users={users} locale={locale} pagination={result.pagination} />
    </div>
  );
}
