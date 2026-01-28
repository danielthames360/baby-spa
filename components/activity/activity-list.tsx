"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale, useFormatter } from "next-intl";
import { ActivityCard } from "./activity-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  performedBy: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ActivityListProps {
  activities: Activity[];
  pagination: Pagination;
  locale: string;
  emptyMessage: string;
}

export function ActivityList({
  activities,
  pagination,
  locale,
  emptyMessage,
}: ActivityListProps) {
  const router = useRouter();
  const t = useTranslations("activity");
  const format = useFormatter();

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(newPage));
    router.push(url.pathname + url.search);
  };

  // Group activities by date
  const groupedActivities = activities.reduce(
    (groups, activity) => {
      const date = new Date(activity.createdAt);
      const dateKey = format.dateTime(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
      return groups;
    },
    {} as Record<string, Activity[]>
  );

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/70 p-12 text-center backdrop-blur-md">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grouped Activities */}
      {Object.entries(groupedActivities).map(([date, dateActivities]) => (
        <div key={date} className="space-y-3">
          {/* Date Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 bg-gradient-to-r from-cyan-50/90 via-teal-50/90 to-white/90 py-2 backdrop-blur-sm">
            <div className="h-px flex-1 bg-gradient-to-r from-teal-300 to-transparent" />
            <span className="text-sm font-medium text-teal-700">{date}</span>
            <div className="h-px flex-1 bg-gradient-to-l from-teal-300 to-transparent" />
          </div>

          {/* Activity Cards */}
          <div className="space-y-2">
            {dateActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/70 p-4 backdrop-blur-md">
          <p className="text-sm text-gray-500">
            {t("pagination.showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>

            <span className="px-3 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl"
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
