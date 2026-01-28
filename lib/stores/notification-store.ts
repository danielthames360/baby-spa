import { create } from "zustand";
import { StaffNotificationType, UserRole } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface NotificationData {
  id: string;
  type: StaffNotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  metadata: {
    date?: string;
    isPendingPayment?: boolean;
    oldDate?: string;
    oldTime?: string;
  } | null;
  isRead: boolean;
  readAt: string | null;
  readBy: {
    id: string;
    name: string;
  } | null;
  forRole: UserRole;
  createdAt: string;
  expiresAt: string;
}

interface NotificationStore {
  // State
  notifications: NotificationData[];
  unreadCount: number;
  lastCreatedAt: string | null;
  isLoading: boolean;
  isPanelOpen: boolean;
  hasInitialLoad: boolean;

  // Actions
  setNotifications: (notifications: NotificationData[]) => void;
  setUnreadCount: (count: number) => void;
  setLastCreatedAt: (timestamp: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  togglePanel: () => void;
  closePanel: () => void;
  openPanel: () => void;
  markAsReadLocally: (id: string) => void;
  markAllAsReadLocally: () => void;
  setHasInitialLoad: (value: boolean) => void;
  reset: () => void;
}

// ============================================================
// STORE
// ============================================================

const initialState = {
  notifications: [],
  unreadCount: 0,
  lastCreatedAt: null,
  isLoading: false,
  isPanelOpen: false,
  hasInitialLoad: false,
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  ...initialState,

  setNotifications: (notifications) =>
    set({ notifications, hasInitialLoad: true }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setLastCreatedAt: (timestamp) => set({ lastCreatedAt: timestamp }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  closePanel: () => set({ isPanelOpen: false }),

  openPanel: () => set({ isPanelOpen: true }),

  markAsReadLocally: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsReadLocally: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  setHasInitialLoad: (value) => set({ hasInitialLoad: value }),

  reset: () => set(initialState),
}));
