import { prisma } from "@/lib/db";
import { AppointmentStatus, Prisma } from "@prisma/client";
import {
  BUSINESS_HOURS,
  MAX_APPOINTMENTS_PER_SLOT,
  MAX_APPOINTMENTS_FOR_STAFF,
  SLOT_DURATION_MINUTES,
  generateTimeSlots,
  getSlotEndTime,
  isWithinBusinessHours,
} from "@/lib/constants/business-hours";
import {
  normalizeToUTCNoon,
  getStartOfDayUTC,
  getEndOfDayUTC,
  fromDateOnly,
} from "@/lib/utils/date-utils";

// Re-export for backwards compatibility
export { BUSINESS_HOURS, MAX_APPOINTMENTS_PER_SLOT, SLOT_DURATION_MINUTES, generateTimeSlots, isWithinBusinessHours };
// Legacy export
export const MAX_APPOINTMENTS_PER_HOUR = MAX_APPOINTMENTS_PER_SLOT;

// Types
export interface AppointmentWithRelations {
  id: string;
  babyId: string;
  selectedPackageId: string | null; // Provisional package selection
  packagePurchaseId: string | null;
  date: Date;
  startTime: string; // "09:00", "09:30", etc.
  endTime: string;   // "10:00", "10:30", etc.
  status: AppointmentStatus;
  notes: string | null;
  cancelReason: string | null;
  // Pending schedule preferences (from portal, before checkout)
  pendingSchedulePreferences: string | null;
  createdAt: Date;
  updatedAt: Date;
  baby: {
    id: string;
    name: string;
    birthDate: Date;
    gender: string;
    parents: {
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
        phone: string;
      };
    }[];
  };
  session?: {
    id: string;
    status: string;
  } | null;
  packagePurchase?: {
    id: string;
    package: {
      id: string;
      name: string;
    };
  } | null;
  selectedPackage?: {
    id: string;
    name: string;
  } | null;
}

export interface TimeSlot {
  time: string;
  available: number;
  total: number;
  appointments: {
    id: string;
    babyName: string;
    status: AppointmentStatus;
  }[];
}

export interface DayAvailability {
  date: string;
  isClosed: boolean;
  closedReason?: string;
  slots: TimeSlot[];
}

export interface CreateAppointmentInput {
  babyId: string;
  date: Date;
  startTime: string; // HH:mm format
  notes?: string;
  userId: string;
  userName: string;
  maxAppointments?: number; // Optional: defaults to staff limit (5). For parents portal, pass 2
  selectedPackageId?: string; // Provisional package selection
  packagePurchaseId?: string; // If using existing package purchase
  createAsPending?: boolean; // If true, create as PENDING_PAYMENT (for packages requiring advance payment)
}

export interface UpdateAppointmentInput {
  date?: Date;
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  maxAppointments?: number; // Optional: defaults to staff limit (5). For parents portal, pass 2
  selectedPackageId?: string; // To change the provisional package
  packagePurchaseId?: string; // To assign an existing package purchase
}

// Default session duration in minutes (used when no package is specified)
const DEFAULT_SESSION_DURATION_MINUTES = 60;

// Helper: Calculate end time from start time (adding session duration)
function calculateEndTime(startTime: string, durationMinutes: number = DEFAULT_SESSION_DURATION_MINUTES): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

// Helper: Check if two time ranges overlap
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert times to minutes for easy comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Overlap if one starts before the other ends
  return s1 < e2 && s2 < e1;
}

// Helper: Get date string in YYYY-MM-DD format (UTC)
// Uses centralized date utility for consistency
function formatDateString(date: Date): string {
  return fromDateOnly(date);
}


// Appointment Service
export const appointmentService = {
  // Get appointments for a date range
  async getByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentWithRelations[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        baby: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            gender: true,
            parents: {
              where: { isPrimary: true },
              select: {
                isPrimary: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            status: true,
          },
        },
        packagePurchase: {
          select: {
            id: true,
            totalSessions: true,
            usedSessions: true,
            remainingSessions: true,
            // Schedule preferences (transferred from appointment at checkout)
            schedulePreferences: true,
            // Installment fields
            paymentPlan: true,
            installments: true,
            installmentAmount: true,
            totalPrice: true,
            finalPrice: true,
            paidAmount: true,
            installmentsPayOnSessions: true,
            package: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                advancePaymentAmount: true,
              },
            },
          },
        },
        selectedPackage: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            advancePaymentAmount: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return appointments as AppointmentWithRelations[];
  },

  // Get appointments for a specific date
  async getByDate(date: Date): Promise<AppointmentWithRelations[]> {
    // Use centralized date utilities for consistent handling
    const startOfDay = getStartOfDayUTC(date);
    const endOfDay = getEndOfDayUTC(date);

    return this.getByDateRange(startOfDay, endOfDay);
  },

  // Get single appointment by ID
  async getById(id: string): Promise<AppointmentWithRelations | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        baby: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            gender: true,
            parents: {
              select: {
                isPrimary: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            status: true,
          },
        },
        packagePurchase: {
          select: {
            id: true,
            totalSessions: true,
            usedSessions: true,
            remainingSessions: true,
            // Schedule preferences (transferred from appointment at checkout)
            schedulePreferences: true,
            // Installment fields
            paymentPlan: true,
            installments: true,
            installmentAmount: true,
            totalPrice: true,
            finalPrice: true,
            paidAmount: true,
            installmentsPayOnSessions: true,
            package: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                advancePaymentAmount: true,
              },
            },
          },
        },
        selectedPackage: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            advancePaymentAmount: true,
          },
        },
      },
    });

    return appointment as AppointmentWithRelations | null;
  },

  // Check if a date is closed
  async isDateClosed(date: Date): Promise<{ closed: boolean; reason?: string }> {
    const closedDate = await prisma.closedDate.findFirst({
      where: {
        date: {
          equals: date,
        },
      },
    });

    if (closedDate) {
      return { closed: true, reason: closedDate.reason || undefined };
    }

    return { closed: false };
  },

  // Get availability for a specific date
  // maxAppointments: defaults to staff limit (5). For parents portal, pass MAX_APPOINTMENTS_FOR_PARENTS (2)
  async getAvailability(date: Date, maxAppointments: number = MAX_APPOINTMENTS_FOR_STAFF): Promise<DayAvailability> {
    const dayOfWeek = date.getDay();
    const dateStr = formatDateString(date);

    // Check if closed
    const { closed, reason } = await this.isDateClosed(date);
    if (closed) {
      return {
        date: dateStr,
        isClosed: true,
        closedReason: reason,
        slots: [],
      };
    }

    // Check if Sunday
    if (dayOfWeek === 0) {
      return {
        date: dateStr,
        isClosed: true,
        closedReason: "Domingo cerrado",
        slots: [],
      };
    }

    // Get all time slots for this day
    const timeSlots = generateTimeSlots(dayOfWeek);

    // Get appointments for this date
    const appointments = await this.getByDate(date);

    // Build slots with availability
    const slots: TimeSlot[] = timeSlots.map((time) => {
      // Count appointments that overlap with this slot
      const slotEnd = getSlotEndTime(time);
      const slotAppointments = appointments.filter((apt) => {
        if (apt.status === AppointmentStatus.CANCELLED) return false;
        // Check if appointment overlaps with this slot
        return timeRangesOverlap(time, slotEnd, apt.startTime, apt.endTime);
      });

      return {
        time,
        available: Math.max(0, maxAppointments - slotAppointments.length),
        total: maxAppointments,
        appointments: slotAppointments.map((apt) => ({
          id: apt.id,
          babyName: apt.baby.name,
          status: apt.status,
        })),
      };
    });

    return {
      date: dateStr,
      isClosed: false,
      slots,
    };
  },

  // Check if baby already has an appointment on this date
  async babyHasAppointmentOnDate(babyId: string, date: Date, excludeAppointmentId?: string): Promise<boolean> {
    // Use centralized date utilities for consistent handling
    const startOfDay = getStartOfDayUTC(date);
    const endOfDay = getEndOfDayUTC(date);

    const existing = await prisma.appointment.findFirst({
      where: {
        babyId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    return !!existing;
  },

  // Count overlapping appointments for a time slot (legacy - kept for reference)
  async countOverlappingAppointments(
    date: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<number> {
    // Use centralized date utilities for consistent handling
    const startOfDay = getStartOfDayUTC(date);
    const endOfDay = getEndOfDayUTC(date);

    // Get all appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    // Count how many overlap with our time range
    return appointments.filter((apt) =>
      timeRangesOverlap(startTime, endTime, apt.startTime, apt.endTime)
    ).length;
  },

  // Check if there's availability for a time range by checking EACH 30-minute slot
  // This is the correct way to validate therapist availability
  // maxAppointments: defaults to staff limit (5). For parents portal, pass MAX_APPOINTMENTS_FOR_PARENTS (2)
  async checkAvailabilityForTimeRange(
    date: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
    maxAppointments: number = MAX_APPOINTMENTS_FOR_STAFF
  ): Promise<{ available: boolean; conflictingSlot?: string; occupiedCount?: number }> {
    // Use centralized date utilities for consistent handling
    const startOfDay = getStartOfDayUTC(date);
    const endOfDay = getEndOfDayUTC(date);

    // Get all appointments for this specific date
    // Using a date range to handle any time component variations
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
    });

    // Convert times to minutes for easier calculation
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const fromMinutes = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);

    // Check each 30-minute slot within the requested time range
    for (let slotStart = startMins; slotStart < endMins; slotStart += SLOT_DURATION_MINUTES) {
      const slotEnd = slotStart + SLOT_DURATION_MINUTES;
      const slotStartTime = fromMinutes(slotStart);

      // Count how many appointments occupy this specific slot
      const occupiedCount = appointments.filter((apt) => {
        const aptStart = toMinutes(apt.startTime);
        const aptEnd = toMinutes(apt.endTime);
        // Appointment occupies this slot if it starts before slot ends AND ends after slot starts
        return aptStart < slotEnd && aptEnd > slotStart;
      }).length;

      // If this slot is at capacity, the new appointment cannot be scheduled
      if (occupiedCount >= maxAppointments) {
        return {
          available: false,
          conflictingSlot: slotStartTime,
          occupiedCount,
        };
      }
    }

    return { available: true };
  },

  // Create appointment
  async create(input: CreateAppointmentInput): Promise<AppointmentWithRelations> {
    const {
      babyId,
      date,
      startTime,
      notes,
      userId,
      userName,
      maxAppointments = MAX_APPOINTMENTS_FOR_STAFF,
      selectedPackageId,
      packagePurchaseId,
      createAsPending = false,
    } = input;

    // Normalize date to UTC noon to avoid timezone day-shift issues
    const appointmentDate = normalizeToUTCNoon(date);

    // Get package duration (from selectedPackageId, packagePurchaseId, or system default)
    let sessionDuration = DEFAULT_SESSION_DURATION_MINUTES;

    if (selectedPackageId) {
      // Look up the package duration
      const pkg = await prisma.package.findUnique({
        where: { id: selectedPackageId },
        select: { duration: true }
      });
      if (pkg) {
        sessionDuration = pkg.duration;
      }
    } else if (packagePurchaseId) {
      // Look up duration from package purchase
      const purchase = await prisma.packagePurchase.findUnique({
        where: { id: packagePurchaseId },
        include: { package: { select: { duration: true } } }
      });
      if (purchase?.package) {
        sessionDuration = purchase.package.duration;
      }
    } else {
      // Use system default package duration
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
        include: { defaultPackage: { select: { duration: true } } }
      });
      if (settings?.defaultPackage) {
        sessionDuration = settings.defaultPackage.duration;
      }
    }

    // Calculate end time based on package duration
    const endTime = calculateEndTime(startTime, sessionDuration);

    // Validate baby exists
    const baby = await prisma.baby.findUnique({
      where: { id: babyId },
    });

    if (!baby) {
      throw new Error("BABY_NOT_FOUND");
    }

    // Check if date is closed
    const { closed } = await this.isDateClosed(appointmentDate);
    if (closed) {
      throw new Error("DATE_CLOSED");
    }

    // Check if within business hours (check both start and end time)
    if (!isWithinBusinessHours(appointmentDate, startTime)) {
      throw new Error("OUTSIDE_BUSINESS_HOURS");
    }

    // Note: We allow multiple appointments per day for the same baby
    // (e.g., different activities like hydrotherapy + stimulation)

    // Check availability for each 30-minute slot within the appointment time range
    // This ensures we have a therapist available for the ENTIRE session duration
    const availability = await this.checkAvailabilityForTimeRange(
      appointmentDate,
      startTime,
      endTime,
      undefined,
      maxAppointments
    );
    if (!availability.available) {
      throw new Error("TIME_SLOT_FULL");
    }

    // Package selection is provisional - confirmed at checkout
    // Session will be deducted from package when completed by reception

    // Determine initial status
    // If createAsPending is true, start as PENDING_PAYMENT (for packages requiring advance payment)
    const initialStatus = createAsPending
      ? AppointmentStatus.PENDING_PAYMENT
      : AppointmentStatus.SCHEDULED;

    // Create appointment (no session deduction at booking time)
    const appointment = await prisma.$transaction(async (tx) => {
      // Create appointment
      const newAppointment = await tx.appointment.create({
        data: {
          babyId,
          date: appointmentDate,
          startTime,
          endTime,
          status: initialStatus,
          notes,
          selectedPackageId,
          packagePurchaseId,
        },
        include: {
          baby: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              gender: true,
              parents: {
                where: { isPrimary: true },
                select: {
                  isPrimary: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          session: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      // Create history entry
      await tx.appointmentHistory.create({
        data: {
          appointmentId: newAppointment.id,
          action: "CREATED",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          newValue: {
            date: formatDateString(appointmentDate),
            startTime,
            endTime,
            status: initialStatus,
          } as Prisma.InputJsonValue,
        },
      });

      return newAppointment;
    });

    return appointment as AppointmentWithRelations;
  },

  // Update appointment
  async update(
    id: string,
    input: UpdateAppointmentInput,
    userId: string,
    userName: string
  ): Promise<AppointmentWithRelations> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    const updateData: Prisma.AppointmentUpdateInput = {};
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};

    // Handle date/time change
    if (input.date || input.startTime) {
      const newDate = normalizeToUTCNoon(input.date ? new Date(input.date) : new Date(existing.date));

      const newStartTime = input.startTime || existing.startTime;

      // Get package duration from existing appointment's package
      let sessionDuration = DEFAULT_SESSION_DURATION_MINUTES;
      if (existing.selectedPackageId) {
        const pkg = await prisma.package.findUnique({
          where: { id: existing.selectedPackageId },
          select: { duration: true }
        });
        if (pkg) sessionDuration = pkg.duration;
      } else if (existing.packagePurchaseId) {
        const purchase = await prisma.packagePurchase.findUnique({
          where: { id: existing.packagePurchaseId },
          include: { package: { select: { duration: true } } }
        });
        if (purchase?.package) sessionDuration = purchase.package.duration;
      }

      const newEndTime = calculateEndTime(newStartTime, sessionDuration);

      // Validate if changing date/time
      if (input.date || input.startTime) {
        // Check if closed
        const { closed } = await this.isDateClosed(newDate);
        if (closed) {
          throw new Error("DATE_CLOSED");
        }

        // Check business hours
        if (!isWithinBusinessHours(newDate, newStartTime)) {
          throw new Error("OUTSIDE_BUSINESS_HOURS");
        }

        // Note: We allow multiple appointments per day for the same baby
        // (e.g., different activities like hydrotherapy + stimulation)

        // Check availability for each 30-minute slot within the appointment time range
        const availability = await this.checkAvailabilityForTimeRange(
          newDate,
          newStartTime,
          newEndTime,
          id,
          input.maxAppointments ?? MAX_APPOINTMENTS_FOR_STAFF
        );
        if (!availability.available) {
          throw new Error("TIME_SLOT_FULL");
        }
      }

      if (input.date) {
        oldValue.date = formatDateString(existing.date);
        newValue.date = formatDateString(newDate);
        updateData.date = newDate;
      }

      if (input.startTime) {
        oldValue.startTime = existing.startTime;
        newValue.startTime = newStartTime;
        oldValue.endTime = existing.endTime;
        newValue.endTime = newEndTime;
        updateData.startTime = newStartTime;
        updateData.endTime = newEndTime;
      }
    }

    // Handle status change
    if (input.status && input.status !== existing.status) {
      oldValue.status = existing.status;
      newValue.status = input.status;
      updateData.status = input.status;

      // If cancelling, just update the reason
      // Note: We no longer return sessions to packages because sessions are
      // only deducted at completion time, not at booking time
      if (input.status === AppointmentStatus.CANCELLED) {
        updateData.cancelReason = input.cancelReason;
      }
    }

    if (input.notes !== undefined) {
      oldValue.notes = existing.notes;
      newValue.notes = input.notes;
      updateData.notes = input.notes;
    }

    // Handle package change
    if (input.packagePurchaseId !== undefined || input.selectedPackageId !== undefined) {
      // Changing to an existing package purchase
      if (input.packagePurchaseId) {
        const purchase = await prisma.packagePurchase.findUnique({
          where: { id: input.packagePurchaseId },
          include: { package: { select: { id: true, name: true, duration: true } } }
        });
        if (!purchase || purchase.babyId !== existing.babyId) {
          throw new Error("INVALID_PACKAGE_PURCHASE");
        }
        if (purchase.remainingSessions <= 0) {
          throw new Error("NO_SESSIONS_REMAINING");
        }

        oldValue.packagePurchaseId = existing.packagePurchaseId;
        oldValue.selectedPackageId = existing.selectedPackageId;
        newValue.packagePurchaseId = input.packagePurchaseId;
        newValue.selectedPackageId = null;

        updateData.packagePurchase = { connect: { id: input.packagePurchaseId } };
        updateData.selectedPackage = { disconnect: true };

        // Recalculate end time based on new package duration
        const newEndTime = calculateEndTime(existing.startTime, purchase.package.duration);
        if (newEndTime !== existing.endTime) {
          oldValue.endTime = existing.endTime;
          newValue.endTime = newEndTime;
          updateData.endTime = newEndTime;
        }
      }
      // Changing to a catalog package (provisional)
      else if (input.selectedPackageId) {
        const pkg = await prisma.package.findUnique({
          where: { id: input.selectedPackageId },
          select: { id: true, name: true, duration: true, isActive: true }
        });
        if (!pkg || !pkg.isActive) {
          throw new Error("INVALID_PACKAGE");
        }

        oldValue.packagePurchaseId = existing.packagePurchaseId;
        oldValue.selectedPackageId = existing.selectedPackageId;
        newValue.packagePurchaseId = null;
        newValue.selectedPackageId = input.selectedPackageId;

        // Disconnect package purchase if there was one
        if (existing.packagePurchaseId) {
          updateData.packagePurchase = { disconnect: true };
        }
        updateData.selectedPackage = { connect: { id: input.selectedPackageId } };

        // Recalculate end time based on new package duration
        const newEndTime = calculateEndTime(existing.startTime, pkg.duration);
        if (newEndTime !== existing.endTime) {
          oldValue.endTime = existing.endTime;
          newValue.endTime = newEndTime;
          updateData.endTime = newEndTime;
        }
      }
      // Clearing package (setting to null) - not typically allowed, but handle gracefully
      else if (input.packagePurchaseId === null && input.selectedPackageId === null) {
        // Do nothing - we don't allow removing package selection entirely
      }
    }

    // Perform update
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          baby: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              gender: true,
              parents: {
                where: { isPrimary: true },
                select: {
                  isPrimary: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          session: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      // Create history entry
      const action = input.status === AppointmentStatus.CANCELLED
        ? "CANCELLED"
        : input.date || input.startTime
          ? "RESCHEDULED"
          : "UPDATED";

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action,
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          oldValue: oldValue as Prisma.InputJsonValue,
          newValue: newValue as Prisma.InputJsonValue,
          reason: input.cancelReason,
        },
      });

      return updated;
    });

    return appointment as AppointmentWithRelations;
  },

  // Cancel appointment
  async cancel(
    id: string,
    reason: string,
    userId: string,
    userName: string
  ): Promise<AppointmentWithRelations> {
    return this.update(
      id,
      {
        status: AppointmentStatus.CANCELLED,
        cancelReason: reason,
      },
      userId,
      userName
    );
  },

  // Mark as no-show
  async markNoShow(
    id: string,
    userId: string,
    userName: string
  ): Promise<AppointmentWithRelations> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // Update appointment and increment parent's no-show count
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.NO_SHOW,
        },
        include: {
          baby: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              gender: true,
              parents: {
                select: {
                  isPrimary: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          session: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      // Increment no-show count for primary parent
      const primaryParent = existing.baby.parents.find((p) => p.isPrimary);
      if (primaryParent) {
        const parent = await tx.parent.update({
          where: { id: primaryParent.parent.id },
          data: {
            noShowCount: { increment: 1 },
          },
        });

        // If 3+ no-shows, require prepayment
        if (parent.noShowCount >= 3) {
          await tx.parent.update({
            where: { id: primaryParent.parent.id },
            data: {
              requiresPrepayment: true,
            },
          });
        }
      }

      // Note: Session is NOT returned to package for no-shows
      // The session is considered "used" even if they didn't show up

      // Create history entry
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: "NO_SHOW",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          oldValue: { status: existing.status } as Prisma.InputJsonValue,
          newValue: { status: AppointmentStatus.NO_SHOW } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });

    return appointment as AppointmentWithRelations;
  },

  // Start appointment (mark as in progress)
  async startAppointment(
    id: string,
    userId: string,
    userName: string
  ): Promise<AppointmentWithRelations> {
    return this.update(
      id,
      { status: AppointmentStatus.IN_PROGRESS },
      userId,
      userName
    );
  },

  // Complete appointment
  async completeAppointment(
    id: string,
    userId: string,
    userName: string
  ): Promise<AppointmentWithRelations> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // Reset no-show count for parent when baby attends
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
        include: {
          baby: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              gender: true,
              parents: {
                select: {
                  isPrimary: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          session: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      // Reset no-show count for primary parent
      const primaryParent = existing.baby.parents.find((p) => p.isPrimary);
      if (primaryParent) {
        await tx.parent.update({
          where: { id: primaryParent.parent.id },
          data: {
            noShowCount: 0,
          },
        });
      }

      // Create history entry
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          action: "COMPLETED",
          performedBy: userId,
          performerType: "USER",
          performerName: userName,
          oldValue: { status: existing.status } as Prisma.InputJsonValue,
          newValue: { status: AppointmentStatus.COMPLETED } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });

    return appointment as AppointmentWithRelations;
  },

  // Get upcoming appointments for a baby
  async getUpcomingForBaby(babyId: string): Promise<AppointmentWithRelations[]> {
    // Use start of day to include all appointments from today onwards
    const today = getStartOfDayUTC(new Date());

    const appointments = await prisma.appointment.findMany({
      where: {
        babyId,
        date: { gte: today },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
      },
      include: {
        baby: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            gender: true,
            parents: {
              where: { isPrimary: true },
              select: {
                isPrimary: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return appointments as AppointmentWithRelations[];
  },
};
