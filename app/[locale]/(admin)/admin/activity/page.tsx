import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { activityService } from "@/lib/services/activity-service";
import { prisma } from "@/lib/db";
import { ActivityType } from "@prisma/client";
import { ActivityList } from "@/components/activity/activity-list";
import { ActivityFilters } from "@/components/activity/activity-filters";
import { serializeForClient } from "@/lib/utils/serialize";

interface ActivityPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    types?: string;
    performedById?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function ActivityPage({
  params,
  searchParams,
}: ActivityPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Only OWNER and ADMIN can access this page
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations("activity");
  const resolvedSearchParams = await searchParams;

  // Parse filters from URL
  const types = resolvedSearchParams.types?.split(",").filter(Boolean);
  const performedById = resolvedSearchParams.performedById || undefined;
  const from = resolvedSearchParams.from
    ? new Date(resolvedSearchParams.from + "T00:00:00")
    : undefined;
  const to = resolvedSearchParams.to
    ? new Date(resolvedSearchParams.to + "T23:59:59")
    : undefined;
  const page = parseInt(resolvedSearchParams.page || "1", 10);

  // Fetch activities and staff users in parallel
  const [activitiesResult, usersRaw] = await Promise.all([
    activityService.list({
      types: types as ActivityType[] | undefined,
      performedById,
      from,
      to,
      page,
      limit: 20,
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["OWNER", "ADMIN", "RECEPTION", "THERAPIST"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize for client components
  // Use type assertion since serializeForClient converts Date to string at runtime
  const activities = serializeForClient(activitiesResult.activities) as unknown as Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    entityType: string | null;
    entityId: string | null;
    metadata: unknown;
    performedBy: { id: string; name: string } | null;
    createdAt: string;
  }>;
  const pagination = activitiesResult.pagination;
  const users = serializeForClient(usersRaw);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <ActivityFilters
        locale={locale}
        users={users}
        initialFilters={{
          types: resolvedSearchParams.types,
          performedById: resolvedSearchParams.performedById,
          from: resolvedSearchParams.from,
          to: resolvedSearchParams.to,
        }}
      />

      {/* Activity List */}
      <ActivityList
        activities={activities}
        pagination={pagination}
        locale={locale}
        emptyMessage={t("empty")}
      />
    </div>
  );
}
