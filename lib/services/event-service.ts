import { prisma } from "@/lib/db";
import { Prisma, EventStatus, EventType } from "@prisma/client";
import { toDateOnly, fromDateOnly, getStartOfDayUTC, getEndOfDayUTC, getTodayUTCNoon } from "@/lib/utils/date-utils";

// Types for service inputs
interface CreateEventInput {
  name: string;
  description?: string | null;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxParticipants?: number;
  blockedTherapists?: number;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  basePrice: number;
  status?: EventStatus;
  internalNotes?: string | null;
  externalNotes?: string | null;
  createdById: string;
}

interface UpdateEventInput {
  name?: string;
  description?: string | null;
  date?: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  maxParticipants?: number;
  blockedTherapists?: number;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  basePrice?: number;
  status?: EventStatus;
  internalNotes?: string | null;
  externalNotes?: string | null;
}

interface EventFilters {
  status?: string; // Can be comma-separated values (e.g., "PUBLISHED,IN_PROGRESS")
  type?: EventType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Standard includes for event queries
const eventInclude = {
  createdBy: {
    select: { id: true, name: true },
  },
  participants: {
    include: {
      baby: {
        include: {
          parents: {
            include: { parent: true },
            where: { isPrimary: true },
          },
        },
      },
      parent: true,
      registeredBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  productUsages: {
    include: {
      product: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.EventInclude;

export const eventService = {
  /**
   * Get all events with filters
   */
  async getAll(filters?: EventFilters) {
    const where: Prisma.EventWhereInput = {};

    if (filters?.status) {
      // Parse comma-separated status values
      const statuses = filters.status.split(",").map((s) => s.trim()) as EventStatus[];
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else {
        where.status = { in: statuses };
      }
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = getStartOfDayUTC(toDateOnly(filters.dateFrom));
      }
      if (filters.dateTo) {
        where.date.lte = getEndOfDayUTC(toDateOnly(filters.dateTo));
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  /**
   * Get event by ID with full details
   */
  async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    return event;
  },

  /**
   * Create a new event
   */
  async create(input: CreateEventInput) {
    const dateValue = toDateOnly(input.date);

    return prisma.event.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        date: dateValue,
        startTime: input.startTime,
        endTime: input.endTime,
        maxParticipants: input.maxParticipants ?? 10,
        blockedTherapists: input.blockedTherapists ?? 0,
        minAgeMonths: input.minAgeMonths,
        maxAgeMonths: input.maxAgeMonths,
        basePrice: input.basePrice,
        status: input.status ?? "DRAFT",
        internalNotes: input.internalNotes,
        externalNotes: input.externalNotes,
        createdById: input.createdById,
      },
      include: eventInclude,
    });
  },

  /**
   * Update an event
   * Can only update DRAFT or PUBLISHED events
   */
  async update(id: string, input: UpdateEventInput) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    // Only allow editing DRAFT or PUBLISHED events
    if (!["DRAFT", "PUBLISHED"].includes(event.status)) {
      throw new Error("EVENT_NOT_EDITABLE");
    }

    const data: Prisma.EventUpdateInput = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.date !== undefined) data.date = toDateOnly(input.date);
    if (input.startTime !== undefined) data.startTime = input.startTime;
    if (input.endTime !== undefined) data.endTime = input.endTime;
    if (input.maxParticipants !== undefined) data.maxParticipants = input.maxParticipants;
    if (input.blockedTherapists !== undefined) data.blockedTherapists = input.blockedTherapists;
    if (input.minAgeMonths !== undefined) data.minAgeMonths = input.minAgeMonths;
    if (input.maxAgeMonths !== undefined) data.maxAgeMonths = input.maxAgeMonths;
    if (input.basePrice !== undefined) data.basePrice = input.basePrice;
    if (input.status !== undefined) data.status = input.status;
    if (input.internalNotes !== undefined) data.internalNotes = input.internalNotes;
    if (input.externalNotes !== undefined) data.externalNotes = input.externalNotes;

    return prisma.event.update({
      where: { id },
      data,
      include: eventInclude,
    });
  },

  /**
   * Update event status
   * When starting an event (IN_PROGRESS), auto-mark all participants as attended
   */
  async updateStatus(id: string, status: EventStatus) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    // Validate status transitions
    const validTransitions: Record<EventStatus, EventStatus[]> = {
      DRAFT: ["PUBLISHED", "CANCELLED"],
      PUBLISHED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[event.status].includes(status)) {
      throw new Error("INVALID_EVENT_STATUS");
    }

    // When starting event, auto-mark all active participants as attended + CONFIRMED
    if (status === "IN_PROGRESS") {
      return prisma.$transaction(async (tx) => {
        // Mark all non-cancelled participants as attended and CONFIRMED
        await tx.eventParticipant.updateMany({
          where: {
            eventId: id,
            status: { not: "CANCELLED" },
          },
          data: {
            attended: true,
            attendedAt: new Date(),
            status: "CONFIRMED",
          },
        });

        // Update event status
        return tx.event.update({
          where: { id },
          data: { status },
          include: eventInclude,
        });
      });
    }

    return prisma.event.update({
      where: { id },
      data: { status },
      include: eventInclude,
    });
  },

  /**
   * Delete an event (only DRAFT events)
   */
  async delete(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    if (event.status !== "DRAFT") {
      throw new Error("EVENT_NOT_DELETABLE");
    }

    return prisma.event.delete({
      where: { id },
    });
  },

  /**
   * Get upcoming events (PUBLISHED status, future dates)
   */
  async getUpcoming(limit: number = 10) {
    const today = getTodayUTCNoon();

    return prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        date: { gte: today },
      },
      include: eventInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: limit,
    });
  },

  /**
   * Get events by date
   */
  async getByDate(date: string) {
    const dateValue = toDateOnly(date);

    return prisma.event.findMany({
      where: {
        date: dateValue,
        status: { in: ["PUBLISHED", "IN_PROGRESS"] },
      },
      include: eventInclude,
      orderBy: { startTime: "asc" },
    });
  },

  /**
   * Check if there are events that conflict with a time range
   * Returns events that overlap with the given date/time range
   */
  async checkDateConflicts(
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ) {
    const dateValue = toDateOnly(date);

    const where: Prisma.EventWhereInput = {
      date: dateValue,
      status: { in: ["PUBLISHED", "IN_PROGRESS"] },
      // Time overlap: event starts before our end AND event ends after our start
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return prisma.event.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Get blocked therapist count for a specific date/time range
   * Used to reduce appointment capacity
   */
  async getBlockedTherapistsForTimeRange(
    date: string,
    startTime: string,
    endTime: string
  ): Promise<number> {
    const conflicts = await this.checkDateConflicts(date, startTime, endTime);

    if (conflicts.length === 0) {
      return 0;
    }

    // Return the maximum blocked therapists from overlapping events
    return Math.max(...conflicts.map((e) => e.blockedTherapists));
  },

  /**
   * Get event summary stats
   */
  async getSummary(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            status: true,
            amountDue: true,
            amountPaid: true,
            attended: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    const activeParticipants = event.participants.filter(
      (p) => p.status !== "CANCELLED"
    );

    const totalExpected = activeParticipants.reduce(
      (sum, p) => sum + Number(p.amountDue),
      0
    );
    const totalPaid = activeParticipants.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0
    );
    const attended = activeParticipants.filter((p) => p.attended === true).length;
    const noShow = activeParticipants.filter((p) => p.attended === false).length;
    const pending = activeParticipants.filter((p) => p.attended === null).length;

    return {
      totalParticipants: activeParticipants.length,
      totalExpected,
      totalPaid,
      totalPending: totalExpected - totalPaid,
      attended,
      noShow,
      pending,
    };
  },
};
