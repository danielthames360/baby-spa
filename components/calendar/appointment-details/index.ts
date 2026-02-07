/**
 * Appointment Details subcomponents
 * Extracted from the main appointment-details.tsx to improve maintainability
 */

export { ClientHeader } from "./client-header";
export { DateTimePackageRow } from "./date-time-package-row";
export { BabyCardSection } from "./baby-card-section";
export { AppointmentActions } from "./appointment-actions";
export { PaymentsSection } from "./payments-section";
export { PackageEditor } from "./package-editor";
export { RescheduleDialog } from "./reschedule-dialog";
export { CancelDialog, NoShowDialog } from "./confirmation-dialogs";

export { statusConfig } from "./status-config";
export type { AppointmentStatus, StatusConfig } from "./status-config";
export type { BabyCardCheckoutInfo, BabyDetails, AppointmentData } from "./types";
