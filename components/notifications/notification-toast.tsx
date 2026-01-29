"use client";

import { CalendarPlus, Clock, X, Calendar, Check, CalendarClock, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationData } from "@/lib/stores/notification-store";
import { useTranslations } from "next-intl";
import { getNotificationStyle, getNotificationIconType } from "@/lib/utils/notification-utils";

interface NotificationToastProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onView: (notification: NotificationData) => void;
  onDismiss: (id: string) => void;
}

// Icon component based on notification type
function NotificationIcon({ iconType }: { iconType: string }) {
  switch (iconType) {
    case "clock":
      return <Clock className="h-3.5 w-3.5 text-white" />;
    case "calendar-clock":
      return <CalendarClock className="h-3.5 w-3.5 text-white" />;
    case "calendar-x":
      return <CalendarX2 className="h-3.5 w-3.5 text-white" />;
    default:
      return <CalendarPlus className="h-3.5 w-3.5 text-white" />;
  }
}

export function NotificationToast({
  notification,
  onMarkAsRead,
  onView,
  onDismiss,
}: NotificationToastProps) {
  const t = useTranslations("notifications");
  const isPending = notification.metadata?.isPendingPayment;

  // Get style based on notification type
  const style = getNotificationStyle(notification.type, isPending);
  const iconType = getNotificationIconType(notification.type, isPending);

  const handleView = () => {
    onView(notification);
    onMarkAsRead(notification.id);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    onDismiss(notification.id);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-72 overflow-hidden rounded-xl border backdrop-blur-md",
        "animate-in slide-in-from-right-full fade-in duration-300",
        style.border,
        "bg-white/80 shadow-lg",
        style.shadow
      )}
    >
      {/* Compact header */}
      <div className="flex items-start gap-2.5 p-3">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm",
            style.iconGradient
          )}
        >
          <NotificationIcon iconType={iconType} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-tight",
                style.titleText
              )}
            >
              {notification.title}
            </span>
            <button
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600"
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            {notification.message}
          </p>
        </div>
      </div>

      {/* Compact actions */}
      <div className="flex items-center justify-end gap-1.5 border-t border-gray-100/50 bg-gray-50/30 px-2.5 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-500 hover:bg-white/50 hover:text-gray-700"
          onClick={handleMarkAsRead}
        >
          <Check className="h-3 w-3" />
          {t("markRead")}
        </Button>

        <Button
          size="sm"
          className={cn(
            "h-7 gap-1 rounded-lg px-2.5 text-xs font-medium shadow-sm text-white",
            style.buttonGradient
          )}
          onClick={handleView}
        >
          <Calendar className="h-3 w-3" />
          {t("view")}
        </Button>
      </div>
    </div>
  );
}
