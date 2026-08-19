import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FreeTimeQueryDto } from './dto/free-time-query.dto';

interface Interval {
  start: Date;
  end: Date;
}

@Injectable()
export class FreeTimeService {
  constructor(private prisma: PrismaService) {}

  async findFreeTime(currentUserId: string, query: FreeTimeQueryDto) {
    const participantIds = Array.from(new Set([currentUserId, ...query.userIds]));

    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
    });

    // Respect each participant's own min/max hour preference (default 8~20).
    // Effective window = intersection (latest start, earliest end) so a
    // recommendation never falls outside anyone's comfort range, unless the
    // caller explicitly overrides minHour/maxHour.
    const minHour = query.minHour ?? Math.max(...users.map((u) => u.freeTimeMinHour), 0);
    const maxHour = query.maxHour ?? Math.min(...users.map((u) => u.freeTimeMaxHour), 24);

    const from = new Date(query.from);
    const to = new Date(query.to);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        userId: { in: participantIds },
        startAt: { lte: to },
        endAt: { gte: from },
      },
    });

    const busyIntervals: Interval[] = schedules.map((s) => ({ start: s.startAt, end: s.endAt }));
    const mergedBusy = this.mergeIntervals(busyIntervals);

    const dayWindows = this.buildDayWindows(from, to, minHour, maxHour);

    if (query.mode === 'fullday') {
      const freeDays = dayWindows.filter(
        (day) => !mergedBusy.some((b) => this.overlaps(b, day)),
      );
      return {
        mode: 'fullday',
        minHour,
        maxHour,
        freeDays: freeDays.map((d) => ({ start: d.start, end: d.end })),
      };
    }

    // mode === 'duration'
    const durationMs = (query.durationMinutes ?? 60) * 60 * 1000;
    const freeSlots: Interval[] = [];

    for (const day of dayWindows) {
      const busyToday = mergedBusy
        .filter((b) => this.overlaps(b, day))
        .map((b) => ({
          start: b.start < day.start ? day.start : b.start,
          end: b.end > day.end ? day.end : b.end,
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      let cursor = day.start;
      for (const busy of busyToday) {
        if (busy.start.getTime() - cursor.getTime() >= durationMs) {
          freeSlots.push({ start: cursor, end: busy.start });
        }
        if (busy.end > cursor) cursor = busy.end;
      }
      if (day.end.getTime() - cursor.getTime() >= durationMs) {
        freeSlots.push({ start: cursor, end: day.end });
      }
    }

    return {
      mode: 'duration',
      minHour,
      maxHour,
      durationMinutes: query.durationMinutes ?? 60,
      freeSlots,
    };
  }

  private mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];
    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: Interval[] = [sorted[0]];

    for (const current of sorted.slice(1)) {
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        if (current.end > last.end) last.end = current.end;
      } else {
        merged.push({ ...current });
      }
    }
    return merged;
  }

  private overlaps(a: Interval, b: Interval): boolean {
    return a.start < b.end && a.end > b.start;
  }

  // Builds one [minHour, maxHour] window per calendar day in [from, to],
  // e.g. minHour=8, maxHour=20 -> prevents recommending 4am slots.
  private buildDayWindows(from: Date, to: Date, minHour: number, maxHour: number): Interval[] {
    const windows: Interval[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= to) {
      const start = new Date(cursor);
      start.setHours(minHour, 0, 0, 0);
      const end = new Date(cursor);
      end.setHours(maxHour, 0, 0, 0);
      windows.push({ start, end });
      cursor.setDate(cursor.getDate() + 1);
    }
    return windows;
  }
}
