import { NextRequest, NextResponse } from "next/server";
import {
  withAuth,
  validateRequest,
  handleApiError,
  createdResponse,
  successResponse,
} from "@/lib/api-utils";
import { staffPaymentService } from "@/lib/services/staff-payment-service";
import { StaffPaymentType, PaymentStatus } from "@prisma/client";
import { z } from "zod";

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const listSchema = z.object({
  staffId: z.string().optional(),
  type: z.string().optional(),
  types: z.array(z.string()).optional(),
  status: z.enum(["PENDING", "PAID"]).optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const createMovementSchema = z.object({
  staffId: z.string().min(1),
  type: z.enum(["BONUS", "COMMISSION", "BENEFIT", "DEDUCTION"]),
  amount: z.number().positive(),
  description: z.string().min(1),
  movementDate: z.string().optional(),
});

const createAdvanceSchema = z.object({
  staffId: z.string().min(1),
  type: z.literal("ADVANCE"),
  amount: z.number().positive(),
  description: z.string().min(1),
  paymentDetails: z.array(z.object({
    amount: z.number().positive(),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
    reference: z.string().optional(),
  })).optional(),
});

const createAdvanceReturnSchema = z.object({
  staffId: z.string().min(1),
  type: z.literal("ADVANCE_RETURN"),
  amount: z.number().positive(),
  description: z.string().min(1),
});

const createSalarySchema = z.object({
  staffId: z.string().min(1),
  type: z.literal("SALARY"),
  periodStart: z.string(),
  periodEnd: z.string(),
  baseSalary: z.number().min(0),
  advanceDeducted: z.number().min(0).optional(),
  description: z.string().min(1),
  paymentDetails: z.array(z.object({
    amount: z.number().positive(),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
    reference: z.string().optional(),
  })).optional(),
});

// Helper to serialize payment for response
function serializePayment(payment: any) {
  return {
    ...payment,
    grossAmount: Number(payment.grossAmount),
    netAmount: Number(payment.netAmount),
    advanceDeducted: payment.advanceDeducted ? Number(payment.advanceDeducted) : null,
    periodStart: payment.periodStart?.toISOString() || null,
    periodEnd: payment.periodEnd?.toISOString() || null,
    movementDate: payment.movementDate?.toISOString() || null,
    paidAt: payment.paidAt?.toISOString() || null,
    createdAt: payment.createdAt.toISOString(),
    deletedAt: payment.deletedAt?.toISOString() || null,
    staff: {
      ...payment.staff,
      baseSalary: payment.staff.baseSalary ? Number(payment.staff.baseSalary) : null,
    },
  };
}

// ============================================================
// GET /api/staff-payments
// ============================================================
export async function GET(request: NextRequest) {
  try {
    await withAuth(["OWNER"]);

    const { searchParams } = new URL(request.url);
    const filters = validateRequest(
      {
        staffId: searchParams.get("staffId") || undefined,
        type: searchParams.get("type") || undefined,
        types: searchParams.get("types")?.split(",").filter(Boolean) || undefined,
        status: searchParams.get("status") || undefined,
        periodStart: searchParams.get("periodStart") || undefined,
        periodEnd: searchParams.get("periodEnd") || undefined,
        from: searchParams.get("from") || undefined,
        to: searchParams.get("to") || undefined,
        includeDeleted: searchParams.get("includeDeleted") || undefined,
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
      },
      listSchema
    );

    const result = await staffPaymentService.list({
      staffId: filters.staffId,
      type: filters.type as StaffPaymentType | undefined,
      types: filters.types as StaffPaymentType[] | undefined,
      status: filters.status as PaymentStatus | undefined,
      periodStart: filters.periodStart ? new Date(filters.periodStart) : undefined,
      periodEnd: filters.periodEnd ? new Date(filters.periodEnd) : undefined,
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
      includeDeleted: filters.includeDeleted,
      page: filters.page,
      limit: filters.limit,
    });

    const serialized = {
      ...result,
      payments: result.payments.map(serializePayment),
    };

    return successResponse(serialized);
  } catch (error) {
    return handleApiError(error, "listing staff payments");
  }
}

// ============================================================
// POST /api/staff-payments
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(["OWNER"]);
    const body = await request.json();

    // Determine which type of payment/movement to create
    const type = body.type as string;

    let result;

    switch (type) {
      case "BONUS":
      case "COMMISSION":
      case "BENEFIT":
      case "DEDUCTION": {
        // Create a movement (record that accumulates)
        const data = validateRequest(body, createMovementSchema);
        result = await staffPaymentService.createMovement({
          staffId: data.staffId,
          type: data.type as StaffPaymentType,
          amount: data.amount,
          description: data.description,
          movementDate: data.movementDate ? new Date(data.movementDate) : undefined,
          createdById: session.user.id,
        });
        break;
      }

      case "ADVANCE": {
        // Create an advance payment
        const data = validateRequest(body, createAdvanceSchema);
        result = await staffPaymentService.createAdvance({
          staffId: data.staffId,
          amount: data.amount,
          description: data.description,
          paymentDetails: data.paymentDetails,
          createdById: session.user.id,
        });
        break;
      }

      case "ADVANCE_RETURN": {
        // Create an advance return
        const data = validateRequest(body, createAdvanceReturnSchema);
        result = await staffPaymentService.createAdvanceReturn({
          staffId: data.staffId,
          amount: data.amount,
          description: data.description,
          createdById: session.user.id,
        });
        break;
      }

      case "SALARY": {
        // Create a salary payment
        const data = validateRequest(body, createSalarySchema);
        result = await staffPaymentService.createSalaryPayment({
          staffId: data.staffId,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          baseSalary: data.baseSalary,
          advanceDeducted: data.advanceDeducted,
          description: data.description,
          paymentDetails: data.paymentDetails,
          createdById: session.user.id,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "INVALID_PAYMENT_TYPE" },
          { status: 400 }
        );
    }

    return createdResponse(serializePayment(result));
  } catch (error) {
    return handleApiError(error, "creating staff payment");
  }
}
