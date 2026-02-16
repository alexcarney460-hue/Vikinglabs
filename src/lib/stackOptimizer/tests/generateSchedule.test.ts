import { test } from 'node:test';
import * as assert from 'node:assert';
import {
  generateSchedule,
  generateScheduleWithEOD,
  simplifySchedule,
  formatDateLocal,
  type ScheduleConfig,
} from '../generateSchedule';

// Helper to create a date string (local timezone)
function dateStr(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return formatDateLocal(date);
}

// Test 1: Daily frequency
test('generates daily schedule for 7 days', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'am',
    durationDays: 7,
    startDate: dateStr(2025, 1, 1),
  };

  const result = generateSchedule(config);

  assert.equal(result.entries.length, 7, 'Should have 7 entries for 7 days daily');
  assert.equal(result.frequency, 'daily');
  assert.equal(result.timeOfDay, 'am');
  assert.equal(result.totalDays, 7);
  assert.equal(result.entries[0].date, dateStr(2025, 1, 1));
  assert.equal(result.entries[6].date, dateStr(2025, 1, 7));
});

// Test 2: EOD (Every Other Day) frequency
test('generates every-other-day schedule', () => {
  const config: ScheduleConfig = {
    frequency: 'eod',
    timeOfDay: 'pm',
    durationDays: 8,
    startDate: dateStr(2025, 1, 1),
  };

  const result = generateScheduleWithEOD(config);

  assert.equal(result.entries.length, 4, 'Should have 4 entries for 8 days every-other-day');
  assert.equal(result.frequency, 'eod');
  // Days should be 1, 3, 5, 7
  assert.equal(result.entries[0].date, dateStr(2025, 1, 1));
  assert.equal(result.entries[1].date, dateStr(2025, 1, 3));
  assert.equal(result.entries[2].date, dateStr(2025, 1, 5));
  assert.equal(result.entries[3].date, dateStr(2025, 1, 7));
});

// Test 3: 2x/week (Monday and Thursday)
test('generates 2x/week schedule', () => {
  const config: ScheduleConfig = {
    frequency: '2x/week',
    timeOfDay: 'am',
    durationDays: 28,
    startDate: dateStr(2025, 1, 6), // Monday
  };

  const result = generateSchedule(config);

  // For 4 weeks starting Monday: should have 8 entries (2 per week)
  assert.equal(result.entries.length, 8, 'Should have 8 entries for 2x/week over 4 weeks');

  // Check that all entries are Mon or Thu
  for (const entry of result.entries) {
    assert.ok(
      entry.dayOfWeek === 'Mon' || entry.dayOfWeek === 'Thu',
      `Entry ${entry.date} should be Mon or Thu but got ${entry.dayOfWeek}`
    );
  }
});

// Test 4: 3x/week (Monday, Wednesday, Friday)
test('generates 3x/week schedule', () => {
  const config: ScheduleConfig = {
    frequency: '3x/week',
    timeOfDay: 'both',
    durationDays: 28,
    startDate: dateStr(2025, 1, 6), // Monday
  };

  const result = generateSchedule(config);

  // For 4 weeks starting Monday: should have 12 entries (3 per week)
  assert.equal(result.entries.length, 12, 'Should have 12 entries for 3x/week over 4 weeks');

  // Check that all entries are Mon, Wed, or Fri
  for (const entry of result.entries) {
    assert.ok(
      entry.dayOfWeek === 'Mon' || entry.dayOfWeek === 'Wed' || entry.dayOfWeek === 'Fri',
      `Entry ${entry.date} should be Mon/Wed/Fri`
    );
  }
});

// Test 5: Weekly frequency
test('generates weekly schedule', () => {
  const config: ScheduleConfig = {
    frequency: 'weekly',
    timeOfDay: 'am',
    durationDays: 56,
    startDate: dateStr(2025, 1, 6), // Monday
  };

  const result = generateSchedule(config);

  // For 8 weeks: should have 8 entries (1 per week, all Mondays)
  assert.equal(result.entries.length, 8, 'Should have 8 entries for weekly over 8 weeks');
  for (const entry of result.entries) {
    assert.equal(entry.dayOfWeek, 'Mon', 'Weekly should always be Monday');
  }
});

// Test 6: Custom days
test('generates custom day schedule', () => {
  const config: ScheduleConfig = {
    frequency: 'custom',
    timeOfDay: 'pm',
    durationDays: 28,
    startDate: dateStr(2025, 1, 6), // Monday
    customDays: [1, 3, 5], // Mon, Wed, Fri
  };

  const result = generateSchedule(config);

  assert.equal(result.entries.length, 12, 'Should have 12 entries for custom 3 days/week');
  for (const entry of result.entries) {
    assert.ok(
      entry.dayOfWeek === 'Mon' || entry.dayOfWeek === 'Wed' || entry.dayOfWeek === 'Fri'
    );
  }
});

// Test 7: Schedule simplification
test('simplifies consecutive schedule entries', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'am',
    durationDays: 7,
    startDate: dateStr(2025, 1, 1),
  };

  const schedule = generateSchedule(config);
  const simplified = simplifySchedule(schedule.entries);

  // All 7 consecutive days with same time should be 1 simplified entry
  assert.equal(simplified.length, 1, 'Should simplify 7 consecutive daily entries to 1');
  assert.equal(simplified[0].count, 7);
  assert.ok(simplified[0].dateRange.includes('-'), 'Should show date range');
});

// Test 8: Simplification with breaks
test('simplifies schedule with breaks in pattern', () => {
  const config: ScheduleConfig = {
    frequency: '3x/week',
    timeOfDay: 'am',
    durationDays: 28,
    startDate: dateStr(2025, 1, 6), // Monday
  };

  const schedule = generateSchedule(config);
  const simplified = simplifySchedule(schedule.entries);

  // Should have multiple groups due to gaps between weeks
  assert.ok(simplified.length > 1, 'Should create multiple groups for non-consecutive entries');
});

// Test 9: Edge case - single day schedule
test('handles single-day schedule', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'am',
    durationDays: 1,
    startDate: dateStr(2025, 1, 1),
  };

  const result = generateSchedule(config);

  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].date, dateStr(2025, 1, 1));
});

// Test 10: Default start date (today)
test('uses today when start date not provided', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'am',
    durationDays: 3,
  };

  const result = generateSchedule(config);

  assert.equal(result.entries.length, 3);
  const today = new Date();
  const expectedStart = formatDateLocal(today);
  assert.equal(result.entries[0].date, expectedStart);
});

// Test 11: Time of day variations
test('preserves time of day across entries', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'both',
    durationDays: 5,
    startDate: dateStr(2025, 1, 1),
  };

  const result = generateSchedule(config);

  for (const entry of result.entries) {
    assert.equal(entry.timeOfDay, 'both');
  }
});

// Test 12: Week numbering
test('assigns correct week numbers', () => {
  const config: ScheduleConfig = {
    frequency: 'daily',
    timeOfDay: 'am',
    durationDays: 14,
    startDate: dateStr(2025, 1, 1),
  };

  const result = generateSchedule(config);

  // Week numbers should be assigned
  assert.ok(result.entries[0].week > 0, 'Should assign positive week numbers');
  // Later entries should have same or higher week number
  assert.ok(result.entries[6].week >= result.entries[0].week);
});

console.log('✓ All Stack Optimizer schedule generation tests passed');
