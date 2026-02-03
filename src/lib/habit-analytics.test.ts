import { describe, test, expect } from 'bun:test'
import {
  daysBetween,
  isConsecutiveDay,
  isSameDay,
  normalizeLogs,
  calculateCurrentStreak,
  calculateLongestStreak,
  findLastOccurrence,
  calculateStats,
  filterLogsByDateRange,
} from './habit-analytics'
import type { HabitLog } from '@prisma/client'

// Helper to create mock HabitLog
function createMockLog(
  eventDate: Date,
  completed: boolean,
  overrides?: Partial<HabitLog>
): HabitLog {
  return {
    id: Math.floor(Math.random() * 10000),
    habitId: 1,
    completed,
    loggedAt: new Date(),
    eventDate,
    quantity: null,
    unit: null,
    timeOfDay: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('Date utility functions', () => {
  test('daysBetween calculates correct difference', () => {
    const date1 = new Date('2026-01-01')
    const date2 = new Date('2026-01-05')
    expect(daysBetween(date1, date2)).toBe(4)
  })

  test('daysBetween handles same date', () => {
    const date = new Date('2026-01-01')
    expect(daysBetween(date, date)).toBe(0)
  })

  test('daysBetween normalizes time differences', () => {
    const date1 = new Date('2026-01-01T08:00:00')
    const date2 = new Date('2026-01-01T20:00:00')
    expect(daysBetween(date1, date2)).toBe(0)
  })

  test('isConsecutiveDay returns true for consecutive dates', () => {
    const date1 = new Date('2026-01-01')
    const date2 = new Date('2026-01-02')
    expect(isConsecutiveDay(date1, date2)).toBe(true)
  })

  test('isConsecutiveDay returns false for non-consecutive dates', () => {
    const date1 = new Date('2026-01-01')
    const date2 = new Date('2026-01-03')
    expect(isConsecutiveDay(date1, date2)).toBe(false)
  })

  test('isSameDay returns true for same calendar day', () => {
    const date1 = new Date('2026-01-01T08:00:00')
    const date2 = new Date('2026-01-01T20:00:00')
    expect(isSameDay(date1, date2)).toBe(true)
  })

  test('isSameDay returns false for different days', () => {
    const date1 = new Date('2026-01-01')
    const date2 = new Date('2026-01-02')
    expect(isSameDay(date1, date2)).toBe(false)
  })
})

describe('normalizeLogs', () => {
  test('removes duplicate same-day logs', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-01'), false),
      createMockLog(new Date('2026-01-02'), true),
    ]

    const normalized = normalizeLogs(logs)
    expect(normalized.length).toBe(2)
  })

  test('prioritizes completed=true when multiple logs same day', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), false),
      createMockLog(new Date('2026-01-01'), true),
    ]

    const normalized = normalizeLogs(logs)
    expect(normalized.length).toBe(1)
    expect(normalized[0].completed).toBe(true)
  })

  test('sorts logs by eventDate ascending', () => {
    const logs = [
      createMockLog(new Date('2026-01-03'), true),
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), true),
    ]

    const normalized = normalizeLogs(logs)
    expect(new Date(normalized[0].eventDate).getDate()).toBe(1)
    expect(new Date(normalized[1].eventDate).getDate()).toBe(2)
    expect(new Date(normalized[2].eventDate).getDate()).toBe(3)
  })
})

describe('calculateCurrentStreak', () => {
  test('returns null for empty logs', () => {
    expect(calculateCurrentStreak([])).toBeNull()
  })

  test('returns null if most recent log is not completed', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), true),
      createMockLog(today, false),
    ]

    expect(calculateCurrentStreak(logs)).toBeNull()
  })

  test('calculates simple 3-day streak', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), true),
      createMockLog(today, true),
    ]

    const streak = calculateCurrentStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(3)
  })

  test('streak breaks with gap > 1 day', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000), true),
      // Gap here (3 days)
      createMockLog(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), true),
      createMockLog(today, true),
    ]

    const streak = calculateCurrentStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(2) // Only counts the recent 2 days
  })

  test('streak breaks with completed=false', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), false),
      createMockLog(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), true),
      createMockLog(today, true),
    ]

    const streak = calculateCurrentStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(2) // Only counts days after the false
  })

  test('returns null if last log is more than 1 day old', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), true),
    ]

    expect(calculateCurrentStreak(logs)).toBeNull()
  })

  test('handles multiple logs same day correctly', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)

    const logs = [
      createMockLog(yesterday, true),
      createMockLog(today, false),
      createMockLog(today, true), // This should be prioritized
    ]

    const streak = calculateCurrentStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(2)
  })
})

describe('calculateLongestStreak', () => {
  test('returns null for empty logs', () => {
    expect(calculateLongestStreak([])).toBeNull()
  })

  test('calculates single day streak', () => {
    const logs = [createMockLog(new Date('2026-01-01'), true)]

    const streak = calculateLongestStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(1)
  })

  test('finds longest streak among multiple streaks', () => {
    const logs = [
      // First streak: 2 days
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), true),
      // Break
      createMockLog(new Date('2026-01-04'), false),
      // Second streak: 4 days (longest)
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-06'), true),
      createMockLog(new Date('2026-01-07'), true),
      createMockLog(new Date('2026-01-08'), true),
      // Break
      createMockLog(new Date('2026-01-10'), false),
      // Third streak: 3 days
      createMockLog(new Date('2026-01-11'), true),
      createMockLog(new Date('2026-01-12'), true),
      createMockLog(new Date('2026-01-13'), true),
    ]

    const streak = calculateLongestStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(4)
    expect(streak?.startDate.getDate()).toBe(5)
    expect(streak?.endDate.getDate()).toBe(8)
  })

  test('handles streak at the end of log history', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-03'), false),
      createMockLog(new Date('2026-01-04'), true),
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-06'), true),
    ]

    const streak = calculateLongestStreak(logs)
    expect(streak).not.toBeNull()
    expect(streak?.length).toBe(3)
  })

  test('streak broken by date gap', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), true),
      // Gap of 2 days
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-06'), true),
    ]

    const streak = calculateLongestStreak(logs)
    expect(streak?.length).toBe(2)
  })
})

describe('findLastOccurrence', () => {
  test('returns null for empty logs', () => {
    expect(findLastOccurrence([], 'BUILD')).toBeNull()
  })

  test('BUILD habit finds last completed=true', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), false),
      createMockLog(new Date('2026-01-03'), true),
      createMockLog(new Date('2026-01-04'), false),
    ]

    const lastOccurrence = findLastOccurrence(logs, 'BUILD')
    expect(lastOccurrence).not.toBeNull()
    expect(lastOccurrence?.eventDate.getDate()).toBe(3)
  })

  test('BREAK habit finds last completed=false (last slip)', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), false), // Last slip
      createMockLog(new Date('2026-01-02'), true),
      createMockLog(new Date('2026-01-03'), true),
      createMockLog(new Date('2026-01-04'), true),
    ]

    const lastOccurrence = findLastOccurrence(logs, 'BREAK')
    expect(lastOccurrence).not.toBeNull()
    expect(lastOccurrence?.eventDate.getDate()).toBe(1)
    expect(lastOccurrence?.completed).toBe(false)
  })

  test('returns null if no matching occurrence found', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), true),
    ]

    const lastOccurrence = findLastOccurrence(logs, 'BREAK')
    expect(lastOccurrence).toBeNull()
  })
})

describe('calculateStats', () => {
  test('returns zero stats for empty logs', () => {
    const stats = calculateStats([])

    expect(stats.totalLogs).toBe(0)
    expect(stats.completionRate).toBe(0)
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.firstLogDate).toBeNull()
    expect(stats.lastLogDate).toBeNull()
  })

  test('calculates comprehensive stats correctly', () => {
    const today = new Date()
    const logs = [
      createMockLog(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000), false),
      createMockLog(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), true),
      createMockLog(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), true),
      createMockLog(today, true),
    ]

    const stats = calculateStats(logs)

    expect(stats.totalLogs).toBe(7)
    expect(stats.completionRate).toBe(85.7) // 6/7 * 100, rounded to 1 decimal
    expect(stats.currentStreak).toBe(4) // Last 4 days
    expect(stats.longestStreak).toBe(4) // Same
    expect(stats.firstLogDate).not.toBeNull()
    expect(stats.lastLogDate).not.toBeNull()
  })

  test('completion rate calculated correctly', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-02'), true),
      createMockLog(new Date('2026-01-03'), true),
      createMockLog(new Date('2026-01-04'), false),
      createMockLog(new Date('2026-01-05'), false),
    ]

    const stats = calculateStats(logs)
    expect(stats.completionRate).toBe(60) // 3/5 * 100
  })
})

describe('filterLogsByDateRange', () => {
  test('filters by start date only', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-10'), true),
    ]

    const filtered = filterLogsByDateRange(logs, new Date('2026-01-05'))
    expect(filtered.length).toBe(2)
  })

  test('filters by end date only', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-10'), true),
    ]

    const filtered = filterLogsByDateRange(logs, undefined, new Date('2026-01-05'))
    expect(filtered.length).toBe(2)
  })

  test('filters by date range', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-10'), true),
      createMockLog(new Date('2026-01-15'), true),
    ]

    const filtered = filterLogsByDateRange(
      logs,
      new Date('2026-01-05'),
      new Date('2026-01-10')
    )
    expect(filtered.length).toBe(2)
  })

  test('returns all logs when no range specified', () => {
    const logs = [
      createMockLog(new Date('2026-01-01'), true),
      createMockLog(new Date('2026-01-05'), true),
      createMockLog(new Date('2026-01-10'), true),
    ]

    const filtered = filterLogsByDateRange(logs)
    expect(filtered.length).toBe(3)
  })
})
