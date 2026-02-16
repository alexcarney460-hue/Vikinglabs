'use client';

import { useState, useEffect, useMemo } from 'react';
import CompoundRow, { type CompoundConfig } from './CompoundRow';
import ScheduleTable from './ScheduleTable';
import ScheduleCalendar from './ScheduleCalendar';
import WarningsPanel from './WarningsPanel';
import ExportButtons from './ExportButtons';
import { generateSchedule, generateScheduleWithEOD, type ScheduleEntry } from '@/lib/stackOptimizer/generateSchedule';
import { calculateComplexity } from '@/lib/stackOptimizer/complexity';
import { generateWarnings } from '@/lib/stackOptimizer/warnings';

interface StackOptimizerState {
  compounds: CompoundConfig[];
  startDate: string;
}

export default function StackOptimizer() {
  const [state, setState] = useState<StackOptimizerState>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const key = 'vl_stack_optimizer_state';
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved) as StackOptimizerState;
          return parsed;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Default state
    const today = new Date();
    const startDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    return {
      compounds: [
        {
          id: '1',
          name: 'Test Compound',
          frequency: '3x/week',
          timeOfDay: 'am',
          durationDays: 28,
          handlingRequirements: [],
        },
      ],
      startDate,
    };
  });

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = 'vl_stack_optimizer_state';
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }
  }, [state]);

  // Generate schedule and warnings
  const scheduleData = useMemo(() => {
    if (state.compounds.length === 0) {
      return { entries: [], totalAdministrations: 0, warnings: [] };
    }

    // Use the first compound's settings for schedule generation
    const primary = state.compounds[0];
    const generator = primary.frequency === 'eod' ? generateScheduleWithEOD : generateSchedule;

    const result = generator({
      frequency: primary.frequency,
      timeOfDay: primary.timeOfDay,
      durationDays: primary.durationDays,
      customDays: primary.customDays,
      startDate: state.startDate,
    });

    const warnings = generateWarnings(
      primary.frequency,
      state.compounds.length,
      primary.durationDays,
      primary.timeOfDay,
      primary.handlingRequirements,
      result.entries.length
    );

    return {
      entries: result.entries,
      totalAdministrations: result.entries.length,
      warnings,
    };
  }, [state.compounds, state.startDate]);

  // Calculate overall complexity
  const overallComplexity = useMemo(() => {
    if (state.compounds.length === 0) return null;

    const primary = state.compounds[0];
    return calculateComplexity(
      primary.frequency,
      state.compounds.length,
      primary.handlingRequirements,
      primary.durationDays
    );
  }, [state.compounds]);

  const addCompound = () => {
    const id = Math.random().toString(36).substring(7);
    setState((prev) => ({
      ...prev,
      compounds: [
        ...prev.compounds,
        {
          id,
          name: `Compound ${prev.compounds.length + 1}`,
          frequency: '3x/week',
          timeOfDay: 'am',
          durationDays: 28,
          handlingRequirements: [],
        },
      ],
    }));
  };

  const updateCompound = (id: string, updated: CompoundConfig) => {
    setState((prev) => ({
      ...prev,
      compounds: prev.compounds.map((c) => (c.id === id ? updated : c)),
    }));
  };

  const removeCompound = (id: string) => {
    setState((prev) => ({
      ...prev,
      compounds: prev.compounds.filter((c) => c.id !== id),
    }));
  };

  const resetToDefault = () => {
    const today = new Date();
    const startDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    setState({
      startDate,
      compounds: [
        {
          id: '1',
          name: 'Test Compound',
          frequency: '3x/week',
          timeOfDay: 'am',
          durationDays: 28,
          handlingRequirements: [],
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3 text-sm text-blue-900">
          <span className="text-lg">ℹ️</span>
          <div>
            <strong>For research planning only.</strong> This tool helps organize research protocols and is not medical advice. Always consult with appropriate professionals before conducting any research.
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      {overallComplexity && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Compounds</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{state.compounds.length}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Duration</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{state.compounds[0]?.durationDays || 0}</div>
            <div className="text-xs text-slate-600">days</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Administrations</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{scheduleData.totalAdministrations}</div>
          </div>

          <div className={`rounded-xl border p-4 ${overallComplexity.level === 'simple' ? 'bg-emerald-50 border-emerald-200' : overallComplexity.level === 'moderate' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Complexity</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{overallComplexity.totalScore}/10</div>
            <div className={`text-xs font-semibold mt-1 ${overallComplexity.level === 'simple' ? 'text-emerald-700' : overallComplexity.level === 'moderate' ? 'text-amber-700' : 'text-red-700'}`}>
              {overallComplexity.level}
            </div>
          </div>
        </div>
      )}

      {/* Compounds Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Research Compounds</h2>
          <button
            onClick={addCompound}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            + Add compound
          </button>
        </div>

        {state.compounds.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
            No compounds added. Click "Add compound" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {state.compounds.map((compound) => (
              <CompoundRow
                key={compound.id}
                compound={compound}
                onChange={(updated) => updateCompound(compound.id, updated)}
                onRemove={removeCompound}
              />
            ))}
          </div>
        )}
      </div>

      {/* Schedule Section */}
      {state.compounds.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Protocol Schedule</h2>
            <p className="mt-1 text-sm text-slate-600">
              Generated schedule for research protocol administration
            </p>
          </div>

          {/* Calendar View */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Calendar</div>
            <ScheduleCalendar
              entries={scheduleData.entries}
              startDate={state.startDate}
              durationDays={state.compounds[0]?.durationDays || 28}
            />
          </div>

          {/* Table View */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">Detailed schedule</div>
              <div className="text-xs text-slate-500">
                {scheduleData.entries.length} administrations
              </div>
            </div>
            <ScheduleTable entries={scheduleData.entries} simplified={false} />
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <ExportButtons
              entries={scheduleData.entries}
              fileName={`protocol-${state.compounds[0]?.name || 'schedule'}`}
            />
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {state.compounds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Protocol Considerations</h2>
          <WarningsPanel warnings={scheduleData.warnings} />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <button
          onClick={resetToDefault}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Reset to default
        </button>
        <div className="text-xs text-slate-500">
          State saved automatically to browser storage
        </div>
      </div>
    </div>
  );
}
