'use client';

import { type ScheduleEntry } from '@/lib/stackOptimizer/generateSchedule';

interface ScheduleCalendarProps {
  entries: ScheduleEntry[];
  startDate: string; // YYYY-MM-DD
  durationDays: number;
}

export default function ScheduleCalendar({ entries, startDate, durationDays }: ScheduleCalendarProps) {
  const scheduledDates = new Set(entries.map((e) => e.date));
  const start = new Date(startDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar grid
  type CalendarDay = {
    date: string;
    dayName: string;
    dayNum: number;
    isScheduled: boolean;
  };

  const calendarDays: CalendarDay[] = [];
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    calendarDays.push({
      date: dateStr,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      isScheduled: scheduledDates.has(dateStr),
    });
  }

  // Group by weeks
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  for (let i = 0; i < calendarDays.length; i++) {
    currentWeek.push(calendarDays[i]);
    if (currentWeek.length === 7 || i === calendarDays.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return (
    <div className="space-y-4">
      {weeks.length <= 4 ? (
        // Compact inline view for <=4 weeks
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`flex flex-col items-center justify-center rounded px-1 py-1 text-xs font-semibold ${
                    day.isScheduled
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title={`${day.dayName}, ${day.date}`}
                >
                  <div className="text-xs text-slate-600">{day.dayName.substring(0, 1)}</div>
                  <div>{day.dayNum}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        // List view for >4 weeks
        <div className="text-sm text-slate-600">
          <div className="grid grid-cols-2 gap-2">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  day.isScheduled
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {day.date} ({day.dayName}) {day.isScheduled ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
            <span>Scheduled ({entries.length} days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-slate-100" />
            <span>Rest ({durationDays - entries.length} days)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
