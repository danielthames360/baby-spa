import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, handleApiError, ApiError } from '@/lib/api-utils';

/**
 * PUT /api/package-purchases/[id]/preferences
 * Update schedule preferences for a package purchase
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(['OWNER', 'ADMIN', 'RECEPTION']);

    const { id } = await params;
    const body = await request.json();
    const { schedulePreferences } = body;

    // Verify package purchase exists
    const existing = await prisma.packagePurchase.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'PACKAGE_PURCHASE_NOT_FOUND');
    }

    // Update preferences
    const updated = await prisma.packagePurchase.update({
      where: { id },
      data: {
        schedulePreferences:
          typeof schedulePreferences === 'string'
            ? schedulePreferences
            : JSON.stringify(schedulePreferences),
      },
      include: {
        package: true,
        baby: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, 'updating preferences');
  }
}

/**
 * GET /api/package-purchases/[id]/preferences
 * Get schedule preferences for a package purchase
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(['OWNER', 'ADMIN', 'RECEPTION', 'THERAPIST']);

    const { id } = await params;

    const purchase = await prisma.packagePurchase.findUnique({
      where: { id },
      select: {
        id: true,
        schedulePreferences: true,
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            duration: true,
          },
        },
        baby: {
          select: {
            id: true,
            name: true,
          },
        },
        remainingSessions: true,
      },
    });

    if (!purchase) {
      throw new ApiError(404, 'PACKAGE_PURCHASE_NOT_FOUND');
    }

    return NextResponse.json(purchase);
  } catch (error) {
    return handleApiError(error, 'getting preferences');
  }
}
