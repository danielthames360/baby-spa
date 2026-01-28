"use client";

import { useRef, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./notification-item";
import { NotificationData } from "@/lib/stores/notification-store";
import { useTranslations } from "next-intl";
import { isToday, isYesterday, isThisWeek } from "date-fns";

interface NotificationPanelProps {
  notifications: NotificationData[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onView: (notification: NotificationData) => void;
  position?: { top: number; right: number };
}

// Breakpoint for mobile (same as Tailwind's sm)
const MOBILE_BREAKPOINT = 640;

// Group notifications by date
function groupNotifications(
  notifications: NotificationData[],
  t: (key: string) => string
) {
  const groups: Record<string, NotificationData[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return [
    { key: "today", label: t("today"), items: groups.today },
    { key: "yesterday", label: t("yesterday"), items: groups.yesterday },
    { key: "thisWeek", label: t("thisWeek"), items: groups.thisWeek },
    { key: "older", label: t("older"), items: groups.older },
  ].filter((group) => group.items.length > 0);
}

export function NotificationPanel({
  notifications,
  isLoading,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onView,
  position,
}: NotificationPanelProps) {
  const t = useTranslations("notifications");
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const hasUnread = notifications.some((n) => !n.isRead);
  const groups = groupNotifications(notifications, t);

  // Check if mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        // Check if clicked on the bell button (has data-notification-bell attribute)
        const target = event.target as HTMLElement;
        if (target.closest("[data-notification-bell]")) {
          return;
        }
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mobile: full-width with margins, centered
  // Desktop: positioned relative to bell button
  const panelStyle = isMobile
    ? {
        zIndex: 9999,
        top: 8,
        left: 8,
        right: 8,
      }
    : {
        zIndex: 9999,
        top: position?.top ?? 0,
        right: position?.right ?? 0,
        width: 384, // w-96
      };

  return (
    <div
      ref={panelRef}
      className="fixed overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50"
      style={panelStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md shadow-teal-200">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{t("title")}</h3>
        </div>

        <div className="flex items-center gap-1">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-teal-600 hover:bg-teal-100 hover:text-teal-700"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("markAllRead")}</span>
            </Button>
          )}

          {/* Close button - more visible on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-200 hover:text-gray-600 sm:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto sm:max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="mb-2 h-8 w-8" />
            <p className="text-sm">{t("noNotifications")}</p>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <h4 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {group.label}
                </h4>
                <div className="space-y-2">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onView={onView}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
