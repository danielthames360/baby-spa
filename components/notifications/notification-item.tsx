"use client";

import { CalendarPlus, Clock, Check, Eye, Calendar, CalendarClock, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationData } from "@/lib/stores/notification-store";
import { formatDistanceToNow } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { getNotificationStyle, getNotificationIconType } from "@/lib/utils/notification-utils";

// Hoisted locale map to avoid recreation on each render (rerender-memo-with-default-value)
const DATE_LOCALES = {
  "pt-BR": ptBR,
  es: es,
} as const;

// Icon component based on notification type
function NotificationIcon({ iconType, className }: { iconType: string; className?: string }) {
  const iconClass = className || "h-4 w-4";
  switch (iconType) {
    case "clock":
      return <Clock className={iconClass} />;
    case "calendar-clock":
      return <CalendarClock className={iconClass} />;
    case "calendar-x":
      return <CalendarX2 className={iconClass} />;
    default:
      return <CalendarPlus className={iconClass} />;
  }
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onView: (notification: NotificationData) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onView,
  compact = false,
}: NotificationItemProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? es;

  const isPending = notification.metadata?.isPendingPayment;
  const style = getNotificationStyle(notification.type, isPending);
  const iconType = getNotificationIconType(notification.type, isPending);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: false,
    locale: dateLocale,
  });

  const handleView = () => {
    onView(notification);
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 transition-all",
        notification.isRead
          ? "border-gray-100 bg-gray-50/50"
          : cn(style.border, "bg-white shadow-sm"),
        compact ? "p-2" : "p-3"
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className={cn(
          "absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full",
          style.indicator
        )} />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            style.iconBg,
            style.iconText
          )}
        >
          <NotificationIcon iconType={iconType} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium",
              notification.isRead ? "text-gray-500" : "text-gray-900"
            )}
          >
            {notification.title}
          </p>

          {/* Message */}
          <p
            className={cn(
              "mt-0.5 text-sm",
              notification.isRead ? "text-gray-400" : "text-gray-600"
            )}
          >
            {notification.message}
          </p>

          {/* Meta */}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{t("ago", { time: timeAgo })}</span>

            {notification.isRead && notification.readBy && (
              <>
                <span>•</span>
                <Eye className="h-3 w-3" />
                <span>{t("readBy", { name: notification.readBy.name })}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-teal-600 hover:bg-teal-50 hover:text-teal-700"
            onClick={handleView}
          >
            <Calendar className="h-3.5 w-3.5" />
            {t("view")}
          </Button>

          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:bg-teal-50 hover:text-teal-600"
              onClick={handleMarkAsRead}
              title={t("markRead")}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
