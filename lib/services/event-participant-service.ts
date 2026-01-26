import { prisma } from "@/lib/db";
import { Prisma, PaymentMethod, ParticipantStatus, DiscountType } from "@prisma/client";

// Types for service inputs
interface AddBabyParticipantInput {
  eventId: string;
  babyId: string;
  discountType?: DiscountType | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  notes?: string | null;
  registeredById: string;
}

interface AddParentParticipantInput {
  eventId: string;
  // Existing parent
  parentId?: string | null;
  // OR new LEAD data
  name?: string;
  phone?: string;
  email?: string;
  pregnancyWeeks?: number | null;
  leadSource?: string | null;
  leadNotes?: string | null;
  // Discount
  discountType?: DiscountType | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  notes?: string | null;
  registeredById: string;
}

interface UpdateParticipantInput {
  status?: ParticipantStatus;
  discountType?: DiscountType | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  notes?: string | null;
}

interface RegisterPaymentInput {
  participantId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
}

// Standard includes for participant queries
const participantInclude = {
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
  event: {
    select: { id: true, name: true, type: true, basePrice: true, status: true },
  },
} satisfies Prisma.EventParticipantInclude;

// Generate unique access code for new LEADs
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BSB-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calculate amount due based on price and discount
function calculateAmountDue(
  basePrice: number | Prisma.Decimal,
  discountType?: DiscountType | null,
  discountAmount?: number | null
): number {
  const price = Number(basePrice);

  if (!discountType) {
    return price;
  }

  if (discountType === "COURTESY") {
    return 0;
  }

  if (discountType === "FIXED" && discountAmount) {
    return Math.max(0, price - discountAmount);
  }

  return price;
}

export const eventParticipantService = {
  /**
   * Get all participants for an event
   */
  async getByEventId(eventId: string) {
    return prisma.eventParticipant.findMany({
      where: { eventId },
      include: participantInclude,
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Get participant by ID
   */
  async getById(participantId: string) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: participantInclude,
    });

    if (!participant) {
      throw new Error("PARTICIPANT_NOT_FOUND");
    }

    return participant;
  },

  /**
   * Add a baby as participant to a BABIES event
   */
  async addBabyParticipant(input: AddBabyParticipantInput) {
    // Get event to validate type and get price
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    if (event.type !== "BABIES") {
      throw new Error("INVALID_PARTICIPANT_TYPE");
    }

    // Check if baby exists
    const baby = await prisma.baby.findUnique({
      where: { id: input.babyId },
    });

    if (!baby) {
      throw new Error("BABY_NOT_FOUND");
    }

    // Check if already registered
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_babyId: {
          eventId: input.eventId,
          babyId: input.babyId,
        },
      },
    });

    if (existing) {
      throw new Error("EVENT_ALREADY_REGISTERED");
    }

    // Check capacity
    const participantCount = await prisma.eventParticipant.count({
      where: {
        eventId: input.eventId,
        status: { not: "CANCELLED" },
      },
    });

    if (participantCount >= event.maxParticipants) {
      throw new Error("EVENT_FULL");
    }

    // Calculate amount due
    const amountDue = calculateAmountDue(
      event.basePrice,
      input.discountType,
      input.discountAmount
    );

    // Determine initial status
    const status: ParticipantStatus =
      input.discountType === "COURTESY" ? "CONFIRMED" : "REGISTERED";

    return prisma.eventParticipant.create({
      data: {
        eventId: input.eventId,
        babyId: input.babyId,
        status,
        discountType: input.discountType,
        discountAmount: input.discountAmount,
        discountReason: input.discountReason,
        amountDue,
        amountPaid: input.discountType === "COURTESY" ? amountDue : 0,
        notes: input.notes,
        registeredById: input.registeredById,
      },
      include: participantInclude,
    });
  },

  /**
   * Add a parent (LEAD) as participant to a PARENTS event
   * Can use existing parent or create new LEAD
   */
  async addParentParticipant(input: AddParentParticipantInput) {
    // Get event to validate type and get price
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
    });

    if (!event) {
      throw new Error("EVENT_NOT_FOUND");
    }

    if (event.type !== "PARENTS") {
      throw new Error("INVALID_PARTICIPANT_TYPE");
    }

    let parentId = input.parentId;

    // If no parentId, create a new LEAD
    if (!parentId) {
      if (!input.name || !input.phone) {
        throw new Error("MISSING_REQUIRED_FIELDS");
      }

      // Check if phone already exists
      const existingParent = await prisma.parent.findUnique({
        where: { phone: input.phone },
      });

      if (existingParent) {
        // Use existing parent
        parentId = existingParent.id;
      } else {
        // Create new LEAD parent
        const accessCode = generateAccessCode();
        const newParent = await prisma.parent.create({
          data: {
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            accessCode,
            status: "LEAD",
            pregnancyWeeks: input.pregnancyWeeks,
            leadSource: input.leadSource,
            leadNotes: input.leadNotes,
          },
        });
        parentId = newParent.id;
      }
    }

    // Check if already registered
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_parentId: {
          eventId: input.eventId,
          parentId: parentId,
        },
      },
    });

    if (existing) {
      throw new Error("EVENT_ALREADY_REGISTERED");
    }

    // Check capacity
    const participantCount = await prisma.eventParticipant.count({
      where: {
        eventId: input.eventId,
        status: { not: "CANCELLED" },
      },
    });

    if (participantCount >= event.maxParticipants) {
      throw new Error("EVENT_FULL");
    }

    // Calculate amount due
    const amountDue = calculateAmountDue(
      event.basePrice,
      input.discountType,
      input.discountAmount
    );

    // Determine initial status
    const status: ParticipantStatus =
      input.discountType === "COURTESY" ? "CONFIRMED" : "REGISTERED";

    return prisma.eventParticipant.create({
      data: {
        eventId: input.eventId,
        parentId,
        status,
        discountType: input.discountType,
        discountAmount: input.discountAmount,
        discountReason: input.discountReason,
        amountDue,
        amountPaid: input.discountType === "COURTESY" ? amountDue : 0,
        notes: input.notes,
        registeredById: input.registeredById,
      },
      include: participantInclude,
    });
  },

  /**
   * Update a participant
   */
  async update(participantId: string, input: UpdateParticipantInput) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: { event: true },
    });

    if (!participant) {
      throw new Error("PARTICIPANT_NOT_FOUND");
    }

    const data: Prisma.EventParticipantUpdateInput = {};

    if (input.status !== undefined) {
      data.status = input.status;
    }

    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    // Recalculate amount if discount changed
    if (input.discountType !== undefined || input.discountAmount !== undefined) {
      const discountType = input.discountType ?? participant.discountType;
      const discountAmount = input.discountAmount ?? Number(participant.discountAmount);

      data.discountType = discountType;
      data.discountAmount = discountAmount;
      data.discountReason = input.discountReason ?? participant.discountReason;
      data.amountDue = calculateAmountDue(
        participant.event.basePrice,
        discountType,
        discountAmount
      );

      // If changed to courtesy, mark as confirmed and paid
      if (discountType === "COURTESY") {
        data.status = "CONFIRMED";
        data.amountPaid = data.amountDue;
        data.paidAt = new Date();
      }
    }

    return prisma.eventParticipant.update({
      where: { id: participantId },
      data,
      include: participantInclude,
    });
  },

  /**
   * Remove a participant
   */
  async remove(participantId: string) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new Error("PARTICIPANT_NOT_FOUND");
    }

    return prisma.eventParticipant.delete({
      where: { id: participantId },
    });
  },

  /**
   * Register a payment for a participant
   */
  async registerPayment(input: RegisterPaymentInput) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: input.participantId },
    });

    if (!participant) {
      throw new Error("PARTICIPANT_NOT_FOUND");
    }

    const newAmountPaid = Number(participant.amountPaid) + input.amount;
    const isFullyPaid = newAmountPaid >= Number(participant.amountDue);

    return prisma.eventParticipant.update({
      where: { id: input.participantId },
      data: {
        amountPaid: newAmountPaid,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        paidAt: new Date(),
        status: isFullyPaid ? "CONFIRMED" : participant.status,
      },
      include: participantInclude,
    });
  },

  /**
   * Mark attendance for a single participant
   */
  async markAttendance(participantId: string, attended: boolean) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new Error("PARTICIPANT_NOT_FOUND");
    }

    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: {
        attended,
        attendedAt: new Date(),
        status: attended ? "CONFIRMED" : "NO_SHOW",
      },
      include: participantInclude,
    });
  },

  /**
   * Mark attendance for multiple participants at once
   */
  async bulkMarkAttendance(
    eventId: string,
    attendanceMap: Array<{ participantId: string; attended: boolean }>
  ) {
    // Use transaction to update all at once
    return prisma.$transaction(
      attendanceMap.map(({ participantId, attended }) =>
        prisma.eventParticipant.update({
          where: { id: participantId },
          data: {
            attended,
            attendedAt: new Date(),
            status: attended ? "CONFIRMED" : "NO_SHOW",
          },
        })
      )
    );
  },

  /**
   * Get event summary (totals)
   */
  async getEventSummary(eventId: string) {
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      select: {
        status: true,
        amountDue: true,
        amountPaid: true,
        attended: true,
      },
    });

    const active = participants.filter((p) => p.status !== "CANCELLED");

    return {
      total: active.length,
      registered: participants.filter((p) => p.status === "REGISTERED").length,
      confirmed: participants.filter((p) => p.status === "CONFIRMED").length,
      cancelled: participants.filter((p) => p.status === "CANCELLED").length,
      noShow: participants.filter((p) => p.status === "NO_SHOW").length,
      attended: active.filter((p) => p.attended === true).length,
      totalExpected: active.reduce((sum, p) => sum + Number(p.amountDue), 0),
      totalPaid: active.reduce((sum, p) => sum + Number(p.amountPaid), 0),
    };
  },
};
