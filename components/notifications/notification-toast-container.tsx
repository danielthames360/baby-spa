"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationToast } from "./notification-toast";
import { NotificationData } from "@/lib/stores/notification-store";

const MAX_VISIBLE_TOASTS = 3;

export function NotificationToastContainer() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("notifications");

  const {
    notifications,
    hasPermission,
    markAsRead,
    openPanel,
  } = useNotifications();

  // Track which notifications have been dismissed
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Get unread notifications that haven't been dismissed
  const unreadNotifications = notifications.filter(
    (n) => !n.isRead && !dismissedIds.has(n.id)
  );

  // Clean stale dismissed IDs when notifications change
  useEffect(() => {
    setDismissedIds((prev) => { // eslint-disable-line react-hooks/set-state-in-effect -- Sync dismissed IDs with external notification state
      const validIds = new Set<string>();
      prev.forEach((id) => {
        if (notifications.some((n) => n.id === id)) {
          validIds.add(id);
        }
      });
      return validIds;
    });
  }, [notifications]);

  // Visible toasts (max 3)
  const visibleToasts = unreadNotifications.slice(0, MAX_VISIBLE_TOASTS);
  const hiddenCount = unreadNotifications.length - MAX_VISIBLE_TOASTS;

  // Dismiss a toast (hide it but don't mark as read)
  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  // Handle view - navigate to appropriate page based on entity type
  const handleView = useCallback(
    (notification: NotificationData) => {
      handleDismiss(notification.id);

      if (notification.entityType === "appointment") {
        const params = new URLSearchParams();

        if (notification.metadata?.date) {
          params.set("date", notification.metadata.date as string);
        }

        if (notification.entityId) {
          params.set("appointmentId", notification.entityId);
        }

        const queryString = params.toString();
        router.push(`/${locale}/admin/calendar${queryString ? `?${queryString}` : ""}`);
      } else if (notification.entityType === "cash_register") {
        router.push(`/${locale}/admin/cash-register`);
      } else {
        router.push(`/${locale}/admin/calendar`);
      }
    },
    [router, locale, handleDismiss]
  );

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsRead(id);
      handleDismiss(id);
    },
    [markAsRead, handleDismiss]
  );

  // Handle view all - open panel
  const handleViewAll = useCallback(() => {
    // Dismiss all visible toasts
    visibleToasts.forEach((n) => handleDismiss(n.id));
    openPanel();
  }, [visibleToasts, handleDismiss, openPanel]);

  // Don't render if no permission or no toasts
  if (!hasPermission || unreadNotifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end gap-2">
      {/* "And X more" card */}
      {hiddenCount > 0 && (
        <div className="pointer-events-auto overflow-hidden rounded-xl border border-white/50 bg-white/80 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Bell className="h-3.5 w-3.5 text-teal-500" />
              <span>{t("andMore", { count: hiddenCount })}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-teal-600 hover:bg-white/50 hover:text-teal-700"
              onClick={handleViewAll}
            >
              {t("viewAll")} →
            </Button>
          </div>
        </div>
      )}

      {/* Visible toasts */}
      {visibleToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onMarkAsRead={handleMarkAsRead}
          onView={handleView}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
