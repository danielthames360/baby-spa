import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, handleApiError } from '@/lib/api-utils';
import { parseDateToUTCNoon, formatLocalDateString } from '@/lib/utils/date-utils';
import { getStaffSlotLimit } from '@/lib/services/settings-service';

/**
 * GET /api/appointments/check-conflicts
 * Check for scheduling conflicts on given dates/times
 *
 * Query params:
 * - dates: comma-separated dates (YYYY-MM-DD)
 * - times: comma-separated times (HH:mm)
 */
export async function GET(request: Request) {
  try {
    await withAuth(['OWNER', 'ADMIN', 'RECEPTION', 'THERAPIST']);

    const { searchParams } = new URL(request.url);
    const datesParam = searchParams.get('dates');
    const timesParam = searchParams.get('times');

    if (!datesParam || !timesParam) {
      return NextResponse.json({ error: 'Missing dates or times parameter' }, { status: 400 });
    }

    const dates = datesParam.split(',').filter((d) => d.trim());
    const times = timesParam.split(',').filter((t) => t.trim());

    if (dates.length === 0 || times.length === 0) {
      return NextResponse.json({ conflicts: [] });
    }

    // Get configurable staff slot limit
    const maxSlotsStaff = await getStaffSlotLimit();

    // Parse all dates to UTC noon format for database query
    const parsedDates: Date[] = [];
    const dateStrMap = new Map<string, string>(); // Map from ISO string to original YYYY-MM-DD

    for (const dateStr of dates) {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

      const date = parseDateToUTCNoon(year, month, day);
      parsedDates.push(date);
      // Store mapping from ISO date to original string for response
      dateStrMap.set(date.toISOString(), dateStr);
    }

    if (parsedDates.length === 0) {
      return NextResponse.json({ conflicts: [] });
    }

    // Single batch query using groupBy - replaces N*M individual count queries
    const counts = await prisma.appointment.groupBy({
      by: ['date', 'startTime'],
      where: {
        date: { in: parsedDates },
        startTime: { in: times },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      _count: { id: true },
    });

    // Map results to response format
    const conflicts = counts
      .filter((c) => c._count.id > 0)
      .map((c) => {
        // Get original date string from map, fallback to formatting from date
        const dateStr = dateStrMap.get(c.date.toISOString()) || formatLocalDateString(c.date);
        return {
          date: dateStr,
          time: c.startTime,
          count: c._count.id,
          available: Math.max(0, maxSlotsStaff - c._count.id),
        };
      });

    return NextResponse.json({ conflicts });
  } catch (error) {
    return handleApiError(error, 'checking conflicts');
  }
}
