import type { HabitLog } from '@prisma/client'

/**
 * Represents a streak period with start and end dates
 */
export interface StreakPeriod {
  startDate: Date
  endDate: Date
  length: number
}

/**
 * Comprehensive statistics for a habit
 */
export interface HabitStats {
  totalLogs: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  firstLogDate: Date | null
  lastLogDate: Date | null
}

/**
 * Calculate the difference in calendar days between two dates
 * Normalizes dates to midnight for accurate day counting
 */
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date(date2)
  d2.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if two dates are consecutive calendar days
 */
export function isConsecutiveDay(earlierDate: Date, laterDate: Date): boolean {
  return daysBetween(earlierDate, laterDate) === 1
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date(date2)
  d2.setHours(0, 0, 0, 0)
  return d1.getTime() === d2.getTime()
}

/**
 * Normalize event dates and remove duplicate same-day logs
 * Keeps only the most recent log per day (highest completed priority)
 */
// hmm
export function normalizeLogs(logs: HabitLog[]): HabitLog[] {
  // Group logs by calendar day
  const logsByDay = new Map<string, HabitLog[]>()

  for (const log of logs) {
    const date = new Date(log.eventDate)
    date.setHours(0, 0, 0, 0)
    const dateKey = date.toISOString()

    if (!logsByDay.has(dateKey)) {
      logsByDay.set(dateKey, [])
    }
    logsByDay.get(dateKey)!.push(log)
  }

  // For each day, keep the most meaningful log
  // Priority: completed=true over false, then most recent loggedAt
  const normalizedLogs: HabitLog[] = []

  for (const dayLogs of Array.from(logsByDay.values())) {
    // Sort by completed (true first) then by loggedAt (most recent first)
    dayLogs.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1
      }
      return new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    })
    normalizedLogs.push(dayLogs[0])
  }

  // Sort by eventDate ascending
  return normalizedLogs.sort((a, b) =>
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  )
}

/**
 * Calculate the current streak from the most recent date
 * A streak is broken by:
 * 1. A log with completed=false
 * 2. A gap of more than 1 day between logs
 *
 * Returns the streak length and start date
 */
export function calculateCurrentStreak(logs: HabitLog[]): StreakPeriod | null {
  if (logs.length === 0) {
    return null
  }

  const normalizedLogs = normalizeLogs(logs)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the most recent log
  let currentIndex = normalizedLogs.length - 1
  const mostRecentLog = normalizedLogs[currentIndex]

  // If most recent log is not completed, streak is 0
  if (!mostRecentLog.completed) {
    return null
  }

  // Check if most recent log is today or yesterday (allow 1-day gap from today)
  const daysSinceLastLog = daysBetween(new Date(mostRecentLog.eventDate), today)
  if (daysSinceLastLog > 1) {
    // Streak is broken if last log is more than 1 day old
    return null
  }

  let streakLength = 1
  let streakStartDate = new Date(mostRecentLog.eventDate)
  let previousDate = new Date(mostRecentLog.eventDate)

  // Walk backwards through logs
  for (let i = currentIndex - 1; i >= 0; i--) {
    const currentLog = normalizedLogs[i]

    // If not completed, streak breaks
    if (!currentLog.completed) {
      break
    }

    const currentDate = new Date(currentLog.eventDate)

    // If gap is more than 1 day, streak breaks
    if (!isConsecutiveDay(currentDate, previousDate)) {
      break
    }

    // Continue streak
    streakLength++
    streakStartDate = currentDate
    previousDate = currentDate
  }

  return {
    startDate: streakStartDate,
    endDate: new Date(mostRecentLog.eventDate),
    length: streakLength,
  }
}

/**
 * Calculate the longest streak in the entire log history
 * Returns all streak periods and identifies the longest
 */
export function calculateLongestStreak(logs: HabitLog[]): StreakPeriod | null {
  if (logs.length === 0) {
    return null
  }

  const normalizedLogs = normalizeLogs(logs)
  let longestStreak: StreakPeriod | null = null

  let currentStreakStart: Date | null = null
  let currentStreakLength = 0
  let previousDate: Date | null = null

  for (const log of normalizedLogs) {
    const currentDate = new Date(log.eventDate)

    if (log.completed) {
      // Check if this continues a streak or starts a new one
      if (previousDate === null || isConsecutiveDay(previousDate, currentDate)) {
        // Continue or start streak
        if (currentStreakStart === null) {
          currentStreakStart = currentDate
        }
        currentStreakLength++
        previousDate = currentDate
      } else {
        // Gap detected - check if previous streak was longest
        if (currentStreakStart && currentStreakLength > 0) {
          const streakPeriod: StreakPeriod = {
            startDate: currentStreakStart,
            endDate: previousDate!,
            length: currentStreakLength,
          }

          if (!longestStreak || currentStreakLength > longestStreak.length) {
            longestStreak = streakPeriod
          }
        }

        // Start new streak
        currentStreakStart = currentDate
        currentStreakLength = 1
        previousDate = currentDate
      }
    } else {
      // completed=false breaks the streak
      if (currentStreakStart && currentStreakLength > 0) {
        const streakPeriod: StreakPeriod = {
          startDate: currentStreakStart,
          endDate: previousDate!,
          length: currentStreakLength,
        }

        if (!longestStreak || currentStreakLength > longestStreak.length) {
          longestStreak = streakPeriod
        }
      }

      // Reset streak
      currentStreakStart = null
      currentStreakLength = 0
      previousDate = currentDate
    }
  }

  // Check final streak
  if (currentStreakStart && currentStreakLength > 0 && previousDate) {
    const streakPeriod: StreakPeriod = {
      startDate: currentStreakStart,
      endDate: previousDate,
      length: currentStreakLength,
    }

    if (!longestStreak || currentStreakLength > longestStreak.length) {
      longestStreak = streakPeriod
    }
  }

  return longestStreak
}

/**
 * Find the last occurrence where the habit was completed
 * For BUILD habits: last time completed=true
 * For BREAK habits: last time completed=false (last time they gave in)
 *
 * @param logs - Array of habit logs
 * @param habitType - 'BUILD' or 'BREAK'
 */
export function findLastOccurrence(
  logs: HabitLog[],
  habitType: 'BUILD' | 'BREAK'
): HabitLog | null {
  if (logs.length === 0) {
    return null
  }

  // For BUILD habits, find last completed=true
  // For BREAK habits, find last completed=false (last time they gave in)
  const targetCompleted = habitType === 'BUILD' ? true : false

  // Sort by eventDate descending to find most recent first
  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  )

  return sortedLogs.find(log => log.completed === targetCompleted) || null
}

/**
 * Calculate comprehensive statistics for a habit
 */
export function calculateStats(logs: HabitLog[]): HabitStats {
  if (logs.length === 0) {
    return {
      totalLogs: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      firstLogDate: null,
      lastLogDate: null,
    }
  }

  const sortedLogs = [...logs].sort((a, b) =>
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  )

  const completedLogs = logs.filter(log => log.completed)
  const completionRate = (completedLogs.length / logs.length) * 100

  const currentStreakResult = calculateCurrentStreak(logs)
  const longestStreakResult = calculateLongestStreak(logs)

  return {
    totalLogs: logs.length,
    completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
    currentStreak: currentStreakResult?.length || 0,
    longestStreak: longestStreakResult?.length || 0,
    firstLogDate: new Date(sortedLogs[0].eventDate),
    lastLogDate: new Date(sortedLogs[sortedLogs.length - 1].eventDate),
  }
}

/**
 * Filter logs by date range
 */
export function filterLogsByDateRange(
  logs: HabitLog[],
  startDate?: Date,
  endDate?: Date
): HabitLog[] {
  return logs.filter(log => {
    const logDate = new Date(log.eventDate)

    if (startDate && logDate < startDate) {
      return false
    }

    if (endDate && logDate > endDate) {
      return false
    }

    return true
  })
}
