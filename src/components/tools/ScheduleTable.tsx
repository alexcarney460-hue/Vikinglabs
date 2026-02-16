'use client';

import { type ScheduleEntry, simplifySchedule } from '@/lib/stackOptimizer/generateSchedule';

interface ScheduleTableProps {
  entries: ScheduleEntry[];
  simplified?: boolean;
}

export default function ScheduleTable({ entries, simplified = false }: ScheduleTableProps) {
  const displayEntries = simplified ? simplifySchedule(entries) : entries;

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No schedule entries yet. Configure a compound above to generate a schedule.
      </div>
    );
  }

  if (simplified) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Date Range</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Time of Day</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">Days</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.map((entry, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{entry.dateRange}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                    {entry.timeOfDay.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600 font-medium">{entry.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Day</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-900">Time</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-900">Week</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{entry.date}</td>
              <td className="px-4 py-3 text-slate-600">{entry.dayOfWeek}</td>
              <td className="px-4 py-3 text-slate-600">
                <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  {entry.timeOfDay.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-slate-600">W{entry.week}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
