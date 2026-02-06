/**
 * Status configuration for appointments
 * Extracted from appointment-details.tsx for reusability
 */

export type AppointmentStatus =
  | "PENDING_PAYMENT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface StatusConfig {
  label: string;
  color: string;
}

export const statusConfig: Record<AppointmentStatus, StatusConfig> = {
  PENDING_PAYMENT: {
    label: "pendingPayment",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  SCHEDULED: {
    label: "scheduled",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  IN_PROGRESS: {
    label: "inProgress",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  COMPLETED: {
    label: "completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  CANCELLED: {
    label: "cancelled",
    color: "bg-rose-100 text-rose-800 border-rose-300",
  },
  NO_SHOW: {
    label: "noShow",
    color: "bg-gray-100 text-gray-800 border-gray-300",
  },
};
