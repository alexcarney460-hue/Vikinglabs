/**
 * Schedule generation logic for Stack Optimizer
 * Generates research protocol administration schedules based on frequency and duration
 */

export type Frequency = 'daily' | 'eod' | '2x/week' | '3x/week' | 'weekly' | 'custom';
export type TimeOfDay = 'am' | 'pm' | 'both';

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  timeOfDay: TimeOfDay;
  dayOfWeek: string;
  week: number;
}

export interface ScheduleConfig {
  frequency: Frequency;
  timeOfDay: TimeOfDay;
  durationDays: number;
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat for 'custom' frequency
  startDate?: string; // YYYY-MM-DD, defaults to today
}

export interface GeneratedSchedule {
  entries: ScheduleEntry[];
  totalDays: number;
  frequency: Frequency;
  timeOfDay: TimeOfDay;
  durationDays: number;
  startDate: string;
}

/**
 * Generate a research protocol schedule
 */
export function generateSchedule(config: ScheduleConfig): GeneratedSchedule {
  // Parse start date as YYYY-MM-DD without timezone conversion
  const startDate = parseLocalDate(config.startDate || formatDateLocal(new Date()));

  const entries: ScheduleEntry[] = [];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + config.durationDays - 1);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let weekCounter = 1;
  let lastWeekNumber = -1;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isoWeek = getISOWeek(d);

    if (isoWeek !== lastWeekNumber) {
      weekCounter = isoWeek;
      lastWeekNumber = isoWeek;
    }

    if (shouldIncludeDay(dayOfWeek, config.frequency, config.customDays)) {
      entries.push({
        date: formatDateLocal(d),
        timeOfDay: config.timeOfDay,
        dayOfWeek: dayNames[dayOfWeek],
        week: weekCounter,
      });
    }
  }

  return {
    entries,
    totalDays: entries.length,
    frequency: config.frequency,
    timeOfDay: config.timeOfDay,
    durationDays: config.durationDays,
    startDate: formatDateLocal(startDate),
  };
}

/**
 * Determine if a given day of week should be included based on frequency
 */
function shouldIncludeDay(
  dayOfWeek: number,
  frequency: Frequency,
  customDays?: number[]
): boolean {
  switch (frequency) {
    case 'daily':
      return true;

    case 'eod': // Every other day
      // This requires day counter - handled in the loop above
      return true; // Will be filtered in eod logic below

    case 'weekly':
      return dayOfWeek === 1; // Monday

    case '2x/week':
      return dayOfWeek === 1 || dayOfWeek === 4; // Mon, Thu

    case '3x/week':
      return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Mon, Wed, Fri

    case 'custom':
      return customDays ? customDays.includes(dayOfWeek) : true;

    default:
      return true;
  }
}

/**
 * Generate schedule with EOD (every 2 days) handled correctly
 */
export function generateScheduleWithEOD(config: ScheduleConfig): GeneratedSchedule {
  if (config.frequency !== 'eod') {
    return generateSchedule(config);
  }

  const startDate = parseLocalDate(config.startDate || formatDateLocal(new Date()));

  const entries: ScheduleEntry[] = [];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + config.durationDays - 1);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let dayCounter = 0;
  let weekCounter = 1;
  let lastWeekNumber = -1;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isoWeek = getISOWeek(d);
    if (isoWeek !== lastWeekNumber) {
      weekCounter = isoWeek;
      lastWeekNumber = isoWeek;
    }

    // Every other day: include on even day numbers (0, 2, 4, ...)
    if (dayCounter % 2 === 0) {
      entries.push({
        date: formatDateLocal(d),
        timeOfDay: config.timeOfDay,
        dayOfWeek: dayNames[d.getDay()],
        week: weekCounter,
      });
    }
    dayCounter++;
  }

  return {
    entries,
    totalDays: entries.length,
    frequency: config.frequency,
    timeOfDay: config.timeOfDay,
    durationDays: config.durationDays,
    startDate: formatDateLocal(startDate),
  };
}

/**
 * Get ISO week number (1-53) from a date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format date as YYYY-MM-DD in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to local Date
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date as YYYY-MM-DD (deprecated, use formatDateLocal)
 */
export function formatDate(date: Date): string {
  return formatDateLocal(date);
}

/**
 * Simplify schedule by grouping consecutive same-time-of-day administrations
 * Returns a simplified view with ranges
 */
export interface SimplifiedScheduleEntry {
  dateRange: string; // "2025-01-01 - 2025-01-05" or single "2025-01-01"
  dates: string[];
  timeOfDay: TimeOfDay;
  count: number;
}

export function simplifySchedule(entries: ScheduleEntry[]): SimplifiedScheduleEntry[] {
  if (entries.length === 0) return [];

  const simplified: SimplifiedScheduleEntry[] = [];
  let currentGroup: ScheduleEntry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];

    const prevDate = new Date(prev.date);
    const currDate = new Date(curr.date);
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    // Group consecutive entries with same time of day
    if (dayDiff === 1 && curr.timeOfDay === prev.timeOfDay) {
      currentGroup.push(curr);
    } else {
      // Flush current group
      simplified.push(createSimplifiedEntry(currentGroup));
      currentGroup = [curr];
    }
  }

  // Flush final group
  simplified.push(createSimplifiedEntry(currentGroup));

  return simplified;
}

function createSimplifiedEntry(group: ScheduleEntry[]): SimplifiedScheduleEntry {
  const dates = group.map((e) => e.date);
  const dateRange =
    dates.length === 1 ? dates[0] : `${dates[0]} - ${dates[dates.length - 1]}`;

  return {
    dateRange,
    dates,
    timeOfDay: group[0].timeOfDay,
    count: dates.length,
  };
}
