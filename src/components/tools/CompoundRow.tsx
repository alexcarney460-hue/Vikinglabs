'use client';

import { type Frequency, type TimeOfDay } from '@/lib/stackOptimizer/generateSchedule';
import { calculateComplexity, getComplexityColor, getComplexityEmoji } from '@/lib/stackOptimizer/complexity';

export interface CompoundConfig {
  id: string;
  name: string;
  frequency: Frequency;
  timeOfDay: TimeOfDay;
  durationDays: number;
  customDays?: number[];
  handlingRequirements: string[];
}

interface CompoundRowProps {
  compound: CompoundConfig;
  onChange: (updated: CompoundConfig) => void;
  onRemove: (id: string) => void;
}

const frequencyOptions: Frequency[] = ['daily', 'eod', '2x/week', '3x/week', 'weekly', 'custom'];
const timeOptions: TimeOfDay[] = ['am', 'pm', 'both'];

export default function CompoundRow({ compound, onChange, onRemove }: CompoundRowProps) {
  const complexity = calculateComplexity(
    compound.frequency,
    1, // Single compound for row-level complexity
    compound.handlingRequirements,
    compound.durationDays
  );

  const handleCustomDaysChange = (day: number, checked: boolean) => {
    const current = compound.customDays || [];
    const updated = checked ? [...current, day].sort((a, b) => a - b) : current.filter((d) => d !== day);
    onChange({ ...compound, customDays: updated });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Compound name
          </label>
          <input
            type="text"
            value={compound.name}
            onChange={(e) => onChange({ ...compound, name: e.target.value })}
            placeholder="e.g., Compound A, Extract 1..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`rounded-lg px-3 py-2 text-xs font-bold ${getComplexityColor(complexity.level)}`}
          >
            <div>{getComplexityEmoji(complexity.level)} {complexity.level}</div>
            <div className="text-xs opacity-75">Score: {complexity.totalScore}/10</div>
          </div>
          <button
            onClick={() => onRemove(compound.id)}
            className="rounded-lg bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100 font-semibold text-sm"
            title="Remove this compound"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Settings grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Frequency */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Frequency
          </label>
          <select
            value={compound.frequency}
            onChange={(e) => onChange({ ...compound, frequency: e.target.value as Frequency })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          >
            {frequencyOptions.map((freq) => (
              <option key={freq} value={freq}>
                {freq === 'eod' ? 'Every 2 days' : freq.charAt(0).toUpperCase() + freq.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Time
          </label>
          <select
            value={compound.timeOfDay}
            onChange={(e) => onChange({ ...compound, timeOfDay: e.target.value as TimeOfDay })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time === 'am' ? '🌅 AM' : time === 'pm' ? '🌆 PM' : '⏰ Both'}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={compound.durationDays}
            onChange={(e) => onChange({ ...compound, durationDays: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Handling Requirements */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Special handling
          </label>
          <div className="flex flex-wrap gap-1">
            {['Refrigerated', 'Light-sensitive'].map((label) => {
              const key = label.toLowerCase().replace('-', '-');
              const isChecked = compound.handlingRequirements.includes(key);
              return (
                <label key={label} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const reqs = e.target.checked
                        ? [...compound.handlingRequirements, key]
                        : compound.handlingRequirements.filter((r) => r !== key);
                      onChange({ ...compound, handlingRequirements: reqs });
                    }}
                    className="rounded border-slate-300"
                  />
                  <span className="text-slate-600">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom days (conditionally shown) */}
      {compound.frequency === 'custom' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            Custom schedule (select days of week)
          </label>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <label key={idx} className="flex flex-col items-center gap-1">
                <input
                  type="checkbox"
                  checked={(compound.customDays || []).includes(idx)}
                  onChange={(e) => handleCustomDaysChange(idx, e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-600">{day}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
