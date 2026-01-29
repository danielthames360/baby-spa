/**
 * Notification styling utilities
 * Centralizes colors and icons for different notification types
 */

import { StaffNotificationType } from "@prisma/client";

export type NotificationStyle = {
  // Icon background gradient (for toast)
  iconGradient: string;
  // Icon background solid (for panel item)
  iconBg: string;
  // Icon text color
  iconText: string;
  // Border color
  border: string;
  // Shadow color
  shadow: string;
  // Title text color
  titleText: string;
  // Button gradient
  buttonGradient: string;
  // Unread indicator color
  indicator: string;
};

const NOTIFICATION_STYLES: Record<string, NotificationStyle> = {
  // New appointment (scheduled)
  NEW_APPOINTMENT: {
    iconGradient: "bg-gradient-to-br from-teal-400 to-cyan-500",
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
    border: "border-teal-200/50",
    shadow: "shadow-teal-500/10",
    titleText: "text-gray-900",
    buttonGradient: "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600",
    indicator: "bg-teal-500",
  },
  // Pending payment (amber/orange)
  PENDING_PAYMENT: {
    iconGradient: "bg-gradient-to-br from-amber-400 to-orange-500",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    border: "border-amber-200/50",
    shadow: "shadow-amber-500/10",
    titleText: "text-amber-900",
    buttonGradient: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    indicator: "bg-amber-500",
  },
  // Rescheduled (blue/indigo)
  RESCHEDULED_APPOINTMENT: {
    iconGradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    border: "border-blue-200/50",
    shadow: "shadow-blue-500/10",
    titleText: "text-blue-900",
    buttonGradient: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600",
    indicator: "bg-blue-500",
  },
  // Cancelled (rose/red)
  CANCELLED_APPOINTMENT: {
    iconGradient: "bg-gradient-to-br from-rose-400 to-red-500",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    border: "border-rose-200/50",
    shadow: "shadow-rose-500/10",
    titleText: "text-rose-900",
    buttonGradient: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600",
    indicator: "bg-rose-500",
  },
};

/**
 * Get notification style based on type and metadata
 */
export function getNotificationStyle(
  type: StaffNotificationType,
  isPendingPayment?: boolean
): NotificationStyle {
  // Pending payment takes precedence for NEW_APPOINTMENT
  if (type === "NEW_APPOINTMENT" && isPendingPayment) {
    return NOTIFICATION_STYLES.PENDING_PAYMENT;
  }

  return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.NEW_APPOINTMENT;
}

/**
 * Icon names for each notification type
 * Components should import the actual icons from lucide-react
 */
export type NotificationIconType = "calendar-plus" | "clock" | "calendar-clock" | "calendar-x";

export function getNotificationIconType(
  type: StaffNotificationType,
  isPendingPayment?: boolean
): NotificationIconType {
  if (type === "NEW_APPOINTMENT" && isPendingPayment) {
    return "clock";
  }

  switch (type) {
    case "RESCHEDULED_APPOINTMENT":
      return "calendar-clock";
    case "CANCELLED_APPOINTMENT":
      return "calendar-x";
    default:
      return "calendar-plus";
  }
}
