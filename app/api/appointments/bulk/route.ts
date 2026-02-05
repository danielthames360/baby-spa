import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, handleApiError, ApiError } from '@/lib/api-utils';
import { parseDateToUTCNoon } from '@/lib/utils/date-utils';

/**
 * POST /api/appointments/bulk
 * Create multiple appointments at once
 */
export async function POST(request: Request) {
  try {
    const session = await withAuth(['OWNER', 'ADMIN', 'RECEPTION']);

    const body = await request.json();
    const { babyId, packagePurchaseId, appointments } = body;

    if (!babyId || !packagePurchaseId || !appointments?.length) {
      throw new ApiError(400, 'MISSING_REQUIRED_FIELDS');
    }

    // Run both queries in parallel for better performance
    const [packagePurchase, existingScheduled] = await Promise.all([
      // Verify package purchase exists and has available sessions
      prisma.packagePurchase.findUnique({
        where: { id: packagePurchaseId },
        include: { package: true },
      }),
      // Count already scheduled appointments for this package
      prisma.appointment.count({
        where: {
          packagePurchaseId,
          status: { in: ['SCHEDULED', 'PENDING_PAYMENT', 'IN_PROGRESS'] },
        },
      }),
    ]);

    if (!packagePurchase) {
      throw new ApiError(404, 'PACKAGE_PURCHASE_NOT_FOUND');
    }

    if (packagePurchase.babyId !== babyId) {
      throw new ApiError(400, 'PACKAGE_NOT_FOR_THIS_BABY');
    }

    const availableSessions = packagePurchase.remainingSessions - existingScheduled;

    if (appointments.length > availableSessions) {
      throw new ApiError(400, 'NO_SESSIONS_REMAINING', {
        requested: appointments.length,
        available: availableSessions,
      });
    }

    // Create all appointments in a transaction
    const createdAppointments = await prisma.$transaction(async (tx) => {
      const created = [];
      const conflicts = [];

      for (const apt of appointments) {
        const [year, month, day] = apt.date.split('-').map(Number);
        const date = parseDateToUTCNoon(year, month, day);

        // Check for existing appointments at this slot
        const existingCount = await tx.appointment.count({
          where: {
            date,
            startTime: apt.startTime,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        });

        // Check if baby already has appointment on this day
        const babyHasAppointment = await tx.appointment.findFirst({
          where: {
            babyId,
            date,
            status: { in: ['SCHEDULED', 'PENDING_PAYMENT', 'IN_PROGRESS'] },
          },
        });

        if (babyHasAppointment) {
          conflicts.push({
            date: apt.date,
            time: apt.startTime,
            reason: 'BABY_ALREADY_HAS_APPOINTMENT',
          });
          continue; // Skip this slot
        }

        // Create the appointment
        const appointment = await tx.appointment.create({
          data: {
            babyId,
            date,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: 'SCHEDULED',
            selectedPackageId: packagePurchase.packageId,
            packagePurchaseId,
          },
        });

        created.push(appointment);

        // Track conflicts (slot has other appointments but is not full)
        if (existingCount > 0 && existingCount < 5) {
          conflicts.push({
            date: apt.date,
            time: apt.startTime,
            existingCount,
          });
        }
      }

      return { created, conflicts };
    });

    return NextResponse.json({
      created: createdAppointments.created.length,
      appointments: createdAppointments.created,
      conflicts: createdAppointments.conflicts,
    });
  } catch (error) {
    return handleApiError(error, 'creating bulk appointments');
  }
}
