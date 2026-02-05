import { prisma } from "@/lib/db";
import {
  MAX_APPOINTMENTS_FOR_STAFF,
  MAX_APPOINTMENTS_FOR_PARENTS,
} from "@/lib/constants/business-hours";

export interface SlotLimits {
  staff: number;
  portal: number;
}

/**
 * Get the configured slot limits from SystemSettings.
 * Falls back to constants if settings don't exist.
 */
export async function getSlotLimits(): Promise<SlotLimits> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { maxSlotsStaff: true, maxSlotsPortal: true },
  });

  return {
    staff: settings?.maxSlotsStaff ?? MAX_APPOINTMENTS_FOR_STAFF,
    portal: settings?.maxSlotsPortal ?? MAX_APPOINTMENTS_FOR_PARENTS,
  };
}

/**
 * Get just the staff slot limit.
 * Useful for admin/reception views.
 */
export async function getStaffSlotLimit(): Promise<number> {
  const limits = await getSlotLimits();
  return limits.staff;
}

/**
 * Get just the portal slot limit.
 * Useful for parent portal views.
 */
export async function getPortalSlotLimit(): Promise<number> {
  const limits = await getSlotLimits();
  return limits.portal;
}
