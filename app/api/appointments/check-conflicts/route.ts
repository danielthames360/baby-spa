import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, handleApiError } from '@/lib/api-utils';
import { parseDateToUTCNoon } from '@/lib/utils/date-utils';

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
    await withAuth(['ADMIN', 'RECEPTION', 'THERAPIST']);

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

    const conflicts = [];

    // For each date/time combination, check appointment count
    for (const dateStr of dates) {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

      const date = parseDateToUTCNoon(year, month, day);

      for (const time of times) {
        const count = await prisma.appointment.count({
          where: {
            date,
            startTime: time,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        });

        // Only report if there are existing appointments
        if (count > 0) {
          conflicts.push({
            date: dateStr,
            time,
            count,
            available: Math.max(0, 5 - count),
          });
        }
      }
    }

    return NextResponse.json({ conflicts });
  } catch (error) {
    return handleApiError(error, 'checking conflicts');
  }
}
