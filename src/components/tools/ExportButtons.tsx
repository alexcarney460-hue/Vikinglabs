'use client';

import { type ScheduleEntry } from '@/lib/stackOptimizer/generateSchedule';

interface ExportButtonsProps {
  entries: ScheduleEntry[];
  fileName?: string;
}

export default function ExportButtons({ entries, fileName = 'protocol-schedule' }: ExportButtonsProps) {
  const generateCSV = () => {
    if (entries.length === 0) return '';

    const headers = ['Date', 'Day of Week', 'Time of Day', 'Week'];
    const rows = entries.map((entry) => [entry.date, entry.dayOfWeek, entry.timeOfDay, entry.week.toString()]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  };

  const handleCopyToClipboard = async () => {
    const csv = generateCSV();
    if (!csv) {
      alert('No schedule to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(csv);
      alert('Schedule copied to clipboard!');
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV();
    if (!csv) {
      alert('No schedule to download');
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleCopyToClipboard}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        title="Copy schedule to clipboard as CSV"
      >
        📋 Copy
      </button>
      <button
        onClick={handleDownloadCSV}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        title="Download schedule as CSV file"
      >
        ⬇ Download CSV
      </button>
    </div>
  );
}
