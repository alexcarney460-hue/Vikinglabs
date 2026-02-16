'use client';

import { type Warning, getWarningColor, getWarningIcon } from '@/lib/stackOptimizer/warnings';

interface WarningsPanelProps {
  warnings: Warning[];
}

export default function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <span>✓</span>
          <span>Protocol configuration looks good</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning) => {
        const isAlert = warning.level === 'alert';
        const isWarning = warning.level === 'warning';

        return (
          <div
            key={warning.id}
            className={`rounded-lg border p-4 ${getWarningColor(warning.level)} ${
              isAlert ? 'border-2' : 'border-2'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{getWarningIcon(warning.level)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{warning.title}</div>
                <div className="mt-1 text-sm opacity-90">{warning.message}</div>
                {warning.suggestion && (
                  <div className="mt-2 text-xs opacity-75">💡 {warning.suggestion}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
