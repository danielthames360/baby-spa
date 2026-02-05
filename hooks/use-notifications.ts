"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useNotificationStore,
  NotificationData,
} from "@/lib/stores/notification-store";
import { useNotificationSound } from "./use-notification-sound";

// Default polling interval: 5 minutes (will be overridden by config)
const DEFAULT_POLLING_INTERVAL = 5 * 60 * 1000;

// Allowed roles for notifications
const ALLOWED_ROLES = ["OWNER", "ADMIN", "RECEPTION"];

interface NotificationCountResponse {
  count: number;
  lastCreatedAt: string | null;
}

interface NotificationListResponse {
  notifications: NotificationData[];
  total: number;
}

export function useNotifications() {
  const { data: session } = useSession();
  const { playSound } = useNotificationSound();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const [pollingInterval, setPollingInterval] = useState(DEFAULT_POLLING_INTERVAL);

  const {
    notifications,
    unreadCount,
    lastCreatedAt,
    isLoading,
    isPanelOpen,
    hasInitialLoad,
    setNotifications,
    setUnreadCount,
    setLastCreatedAt,
    setIsLoading,
    togglePanel,
    closePanel,
    openPanel,
    markAsReadLocally,
    markAllAsReadLocally,
    setHasInitialLoad,
  } = useNotificationStore();

  // Check if user has permission to see notifications
  const hasPermission =
    session?.user?.role && ALLOWED_ROLES.includes(session.user.role);

  // Fetch config (polling interval)
  const fetchConfig = useCallback(async () => {
    if (!hasPermission) return;

    try {
      const response = await fetch("/api/notifications/config");
      if (!response.ok) return;

      const data = await response.json();
      if (data.pollingInterval) {
        // Convert minutes to milliseconds
        setPollingInterval(data.pollingInterval * 60 * 1000);
      }
    } catch (error) {
      console.error("Error fetching notification config:", error);
    }
  }, [hasPermission]);

  // Fetch count (lightweight polling endpoint)
  const fetchCount = useCallback(async (): Promise<NotificationCountResponse | null> => {
    if (!hasPermission) return null;

    try {
      const response = await fetch("/api/notifications/count");
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return null;
    }
  }, [hasPermission]);

  // Fetch full notifications list
  const fetchNotifications = useCallback(async () => {
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50");
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data: NotificationListResponse = await response.json();
      setNotifications(data.notifications);

      const unread = data.notifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      if (data.notifications.length > 0) {
        setLastCreatedAt(data.notifications[0].createdAt);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, setNotifications, setUnreadCount, setLastCreatedAt, setIsLoading]);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      markAsReadLocally(id);

      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
        });

        if (!response.ok) {
          // Revert on error - refetch
          await fetchNotifications();
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
        await fetchNotifications();
      }
    },
    [markAsReadLocally, fetchNotifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    markAllAsReadLocally();

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        // Revert on error - refetch
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      await fetchNotifications();
    }
  }, [markAllAsReadLocally, fetchNotifications]);

  // Check for new notifications (polling logic)
  const checkForNew = useCallback(async () => {
    if (!hasPermission) return;

    const data = await fetchCount();
    if (!data) return;

    // Check if there are new notifications
    const hasNew =
      data.lastCreatedAt &&
      lastCreatedAt &&
      new Date(data.lastCreatedAt) > new Date(lastCreatedAt);

    // Update count
    setUnreadCount(data.count);
    if (data.lastCreatedAt) {
      setLastCreatedAt(data.lastCreatedAt);
    }

    // If there are new notifications, fetch full list and play sound
    if (hasNew) {
      await fetchNotifications();
      playSound();
    }
  }, [
    hasPermission,
    fetchCount,
    lastCreatedAt,
    setUnreadCount,
    setLastCreatedAt,
    fetchNotifications,
    playSound,
  ]);

  // Initial load
  useEffect(() => {
    if (!hasPermission || hasInitialLoad) return;

    const doInitialLoad = async () => {
      // Fetch config first to get polling interval
      await fetchConfig();
      await fetchNotifications();

      // Play sound on initial load if there are unread notifications
      const currentUnread = useNotificationStore.getState().unreadCount;
      if (currentUnread > 0 && isInitialLoadRef.current) {
        playSound();
        isInitialLoadRef.current = false;
      }
    };

    doInitialLoad();
  }, [hasPermission, hasInitialLoad, fetchConfig, fetchNotifications, playSound]);

  // Setup polling with dynamic interval
  useEffect(() => {
    if (!hasPermission || !hasInitialLoad) return;

    // Clear existing interval if any
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Start polling with current interval
    pollingRef.current = setInterval(checkForNew, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasPermission, hasInitialLoad, checkForNew, pollingInterval]);

  // Reset on logout
  useEffect(() => {
    if (!session && hasInitialLoad) {
      useNotificationStore.getState().reset();
      isInitialLoadRef.current = true;
    }
  }, [session, hasInitialLoad]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isPanelOpen,
    hasPermission,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    togglePanel,
    closePanel,
    openPanel,
    checkForNew,
  };
}
