"use client";

import { Bell, Clock, X, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationData } from "@/lib/stores/notification-store";
import { useTranslations } from "next-intl";

interface NotificationToastProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onView: (notification: NotificationData) => void;
  onDismiss: (id: string) => void;
}

export function NotificationToast({
  notification,
  onMarkAsRead,
  onView,
  onDismiss,
}: NotificationToastProps) {
  const t = useTranslations("notifications");
  const isPending = notification.metadata?.isPendingPayment;

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
        isPending
          ? "border-amber-200/50 bg-white/80 shadow-lg shadow-amber-500/10"
          : "border-white/50 bg-white/80 shadow-lg shadow-teal-500/10"
      )}
    >
      {/* Compact header */}
      <div className="flex items-start gap-2.5 p-3">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm",
            isPending
              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200/50"
              : "bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-200/50"
          )}
        >
          {isPending ? (
            <Clock className="h-3.5 w-3.5 text-white" />
          ) : (
            <Bell className="h-3.5 w-3.5 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold leading-tight",
                isPending ? "text-amber-900" : "text-gray-900"
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
            "h-7 gap-1 rounded-lg px-2.5 text-xs font-medium shadow-sm",
            isPending
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
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
