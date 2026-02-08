"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPanel } from "./notification-panel";
import { NotificationData } from "@/lib/stores/notification-store";

export function NotificationBell() {
  const router = useRouter();
  const locale = useLocale();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    isPanelOpen,
    hasPermission,
    markAsRead,
    markAllAsRead,
    togglePanel,
    closePanel,
  } = useNotifications();

  // Track if component is mounted (for portal - avoids hydration mismatch)
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
  }, []);

  // Update panel position when opening
  useEffect(() => {
    if (isPanelOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isPanelOpen]);

  // Handle view notification - navigate to appropriate page based on entity type
  const handleView = (notification: NotificationData) => {
    closePanel();

    // Navigate based on entity type
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
      // Navigate to cash register page
      router.push(`/${locale}/admin/cash-register`);
    } else {
      // Default: just go to calendar
      router.push(`/${locale}/admin/calendar`);
    }
  };

  // Don't render if user doesn't have permission
  if (!hasPermission) {
    return null;
  }

  return (
    <>
      {/* Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 rounded-full",
          isPanelOpen && "bg-teal-50"
        )}
        onClick={togglePanel}
        data-notification-bell
      >
        <Bell
          className={cn(
            "h-5 w-5 transition-colors",
            unreadCount > 0 ? "text-teal-600" : "text-gray-500"
          )}
        />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white",
              unreadCount > 9 && "text-[10px]"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-5 w-5 animate-ping rounded-full bg-rose-400 opacity-75" />
        )}
      </Button>

      {/* Panel rendered via portal to avoid z-index issues */}
      {mounted && createPortal(
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          isOpen={isPanelOpen}
          onClose={closePanel}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onView={handleView}
          position={panelPosition}
        />,
        document.body
      )}
    </>
  );
}
