/**
 * @deprecated This file is kept for backwards compatibility.
 * Import from '@/components/portal/portal-appointments' instead.
 */

// Re-export everything from the refactored module
export {
  PortalAppointments,
  ScheduleDialog,
  AppointmentCard,
  PaymentInstructionsDialog,
} from "./portal-appointments/index";

export type {
  BabyPackage,
  ScheduleBabyData,
  BabyData,
  Appointment,
  ParentInfo,
  TimeSlot,
  WizardStep,
  ClientType,
  PaymentSettings,
  BabyCardPortalInfo,
} from "./portal-appointments/types";

// Also export ScheduleDialogProps for backwards compatibility
export type { ScheduleDialogProps } from "./portal-appointments/schedule-dialog";
