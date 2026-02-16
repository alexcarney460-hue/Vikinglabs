/**
 * Warnings system for Stack Optimizer
 * Generates non-medical logic-based warnings for research protocol consistency and complexity
 */

export interface Warning {
  id: string;
  level: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  suggestion?: string;
}

export interface WarningFlag {
  title: string;
  message: string;
}

export interface ScheduleEntry {
  date: string;
  timeOfDay: string;
  dayOfWeek: string;
  week: number;
}

export interface CompoundData {
  name: string;
  frequency: string;
  durationDays: number;
}

/**
 * Check for warnings based on generated schedule and compounds
 * Returns non-medical, logic-based warnings
 */
export function checkWarnings(
  entries: ScheduleEntry[],
  compounds: CompoundData[]
): WarningFlag[] {
  const warnings: WarningFlag[] = [];

  if (entries.length === 0 || compounds.length === 0) {
    return warnings;
  }

  // 1. High daily frequency: Daily + duration >= 14 days
  const dailyCompounds = compounds.filter((c) => c.frequency === 'daily');
  for (const compound of dailyCompounds) {
    if (compound.durationDays >= 14) {
      warnings.push({
        title: 'High-frequency protocol detected',
        message: `"${compound.name}" has daily administration for ${compound.durationDays} days. Ensure your research plan is consistent and track observations carefully.`,
      });
    }
  }

  // 2. Many events per day: peak >= 3
  const eventsByDate = new Map<string, number>();
  entries.forEach((e) => {
    eventsByDate.set(e.date, (eventsByDate.get(e.date) || 0) + 1);
  });
  const peakDaily = Math.max(0, ...Array.from(eventsByDate.values()));
  if (peakDaily >= 3) {
    warnings.push({
      title: 'Multiple same-day administrations detected',
      message: `Peak of ${peakDaily} administrations on a single day. Consider grouping times to reduce schedule complexity.`,
    });
  }

  // 3. No rest days: events on 7+ consecutive days
  let consecutiveDays = 0;
  let maxConsecutive = 0;
  const sortedDates = Array.from(eventsByDate.keys()).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0 || isConsecutiveDate(sortedDates[i - 1], sortedDates[i])) {
      consecutiveDays++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
      consecutiveDays = 1;
    }
  }
  maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
  if (maxConsecutive >= 7) {
    warnings.push({
      title: 'No rest days detected',
      message: `${maxConsecutive} consecutive days with administrations. Some researchers prefer rest days for cleaner observation blocks.`,
    });
  }

  // 4. Stack complexity: >= 4 compounds OR >= 60 total events
  if (compounds.length >= 4 || entries.length >= 60) {
    warnings.push({
      title: 'High complexity stack',
      message: `${compounds.length} compound${compounds.length !== 1 ? 's' : ''} with ${entries.length} total administration event${entries.length !== 1 ? 's' : ''}. Consider simplifying for clearer observation attribution.`,
    });
  }

  // 5. Time fragmentation: 3+ distinct times on a single day
  const timesByDate = new Map<string, Set<string>>();
  entries.forEach((e) => {
    if (!timesByDate.has(e.date)) {
      timesByDate.set(e.date, new Set());
    }
    timesByDate.get(e.date)!.add(e.timeOfDay);
  });
  for (const [date, times] of timesByDate.entries()) {
    if (times.size >= 3) {
      warnings.push({
        title: 'Time fragmentation detected',
        message: `${times.size} distinct time slots on ${date}. Use 'Simplify schedule' to reduce time slots.`,
      });
      break;
    }
  }

  return warnings;
}

function isConsecutiveDate(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

/**
 * Generate warnings based on protocol configuration (legacy function)
 */
export function generateWarnings(
  frequency: string,
  compoundCount: number,
  durationDays: number,
  timeOfDay: string,
  handlingRequirements: string[] = [],
  totalAdministrations: number = 0
): Warning[] {
  const warnings: Warning[] = [];

  if (frequency === 'daily' && durationDays < 7) {
    warnings.push({
      id: 'short-daily',
      level: 'info',
      title: 'Short protocol duration',
      message: 'Daily administration planned for less than 7 days. Consider alignment with research objectives.',
      suggestion: 'Extend to at least 7 days for more meaningful protocol data.',
    });
  }

  if (frequency === 'custom' && compoundCount > 1) {
    warnings.push({
      id: 'custom-multiple',
      level: 'warning',
      title: 'Custom schedule with multiple compounds',
      message:
        'Using custom days with multiple compounds may create inconsistent administration patterns. Ensure all compounds follow the same schedule.',
      suggestion:
        'Verify that custom days apply consistently to all compounds in the protocol.',
    });
  }

  if (frequency === 'daily' && durationDays > 60) {
    warnings.push({
      id: 'prolonged-daily',
      level: 'warning',
      title: 'Extended daily protocol',
      message: 'Daily administration for over 60 days is a lengthy research protocol.',
      suggestion: 'Consider compliance tracking and storage stability over the extended timeline.',
    });
  }

  if (compoundCount > 5) {
    warnings.push({
      id: 'too-many-compounds',
      level: 'warning',
      title: 'High compound count',
      message: `${compoundCount} compounds require careful tracking and organization.`,
      suggestion: 'Verify labeling and organization system. Consider grouping by handling requirements.',
    });
  }

  if (
    handlingRequirements.includes('refrigeration') &&
    handlingRequirements.includes('light-sensitive')
  ) {
    warnings.push({
      id: 'dual-handling',
      level: 'warning',
      title: 'Multiple special handling requirements',
      message:
        'Compounds require both refrigeration and light protection. Ensure storage system accommodates both.',
      suggestion: 'Use amber/opaque containers in refrigerated storage, or specialized protective containers.',
    });
  }

  if (timeOfDay === 'both' && totalAdministrations > 20) {
    warnings.push({
      id: 'both-times',
      level: 'info',
      title: 'AM/PM administration schedule',
      message: `${totalAdministrations} administrations split between AM and PM. Ensure consistent timing windows.`,
      suggestion: 'Define specific AM window (e.g., 6-10 AM) and PM window (e.g., 4-8 PM) for consistency.',
    });
  }

  if (durationDays < 7 && frequency !== 'daily') {
    warnings.push({
      id: 'short-research',
      level: 'info',
      title: 'Short research protocol',
      message: 'Protocol duration less than 7 days may not provide sufficient data points.',
      suggestion: 'Ensure protocol duration aligns with research objectives.',
    });
  }

  if (totalAdministrations > 50) {
    warnings.push({
      id: 'high-burden',
      level: 'warning',
      title: 'High administration frequency',
      message: `${totalAdministrations} total administrations across the protocol.`,
      suggestion: 'Ensure adequate organization and tracking systems for compliance.',
    });
  }

  if (frequency === '3x/week' && durationDays < 14) {
    warnings.push({
      id: 'insufficient-weeks',
      level: 'info',
      title: 'Limited protocol weeks',
      message: '3x/week schedule over less than 2 weeks provides limited data.',
      suggestion: 'Extend protocol to at least 2-4 weeks for better protocol consistency.',
    });
  }

  return warnings;
}

/**
 * Get color classes for warning level
 */
export function getWarningColor(level: string): string {
  const colors: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    alert: 'bg-red-50 border-red-200 text-red-800',
  };
  return colors[level] || colors.info;
}

/**
 * Get icon for warning level
 */
export function getWarningIcon(level: string): string {
  const icons: Record<string, string> = {
    info: 'ℹ',
    warning: '⚠',
    alert: '🚨',
  };
  return icons[level] || icons.info;
}
