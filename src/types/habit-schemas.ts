import { z } from 'zod'

/**
 * Zod schemas for habit tracking validation
 */

// ============================================================================
// ALLOWED UNITS - Normalized values only
// ============================================================================

/**
 * Strictly defined unit values that the LLM must map to.
 * The LLM prompt guides normalization, but Zod enforces only these values are accepted.
 */
export const allowedUnits = [
  // Distance
  'km',
  'miles',
  'meters',
  // Time
  'minutes',
  'hours',
  'seconds',
  // Weight
  'pounds',
  'kg',
  // Volume
  'oz',
  'liters',
  'ml',
  // Count (common examples - can be extended)
  'pages',
  'reps',
  'drinks',
  'cigarettes',
  'cups',
  'glasses',
] as const

export type AllowedUnit = typeof allowedUnits[number]

// ============================================================================
// HABIT LOGGING SCHEMAS
// ============================================================================

/**
 * Schema for parsed habit log data from natural language
 * This is the output structure from the LLM when parsing user input
 */
export const habitLogParseSchema = z.object({
  habitName: z.string().min(1).describe('Normalized habit name (lowercase, concise)'),
  completed: z.boolean().describe('Whether the habit was completed/avoided'),
  habitType: z.enum(['BUILD', 'BREAK']).describe('BUILD = cultivate, BREAK = avoid'),
  quantity: z.number().nullable().describe('Optional numeric quantity'),
  unit: z.enum(allowedUnits).nullable().describe('Optional unit - MUST be one of the normalized values: km, miles, meters, minutes, hours, seconds, pounds, kg, oz, liters, ml, pages, reps, drinks, cigarettes, cups, glasses'),
  timeOfDay: z.string().nullable().describe('Optional time: morning, afternoon, evening, night'),
  eventDate: z.string().describe('ISO date string when the habit occurred'),
  notes: z.string().nullable().describe('Optional notes or context'),
})

export type HabitLogParse = z.infer<typeof habitLogParseSchema>

/**
 * Schema for the successful logging response
 */
export const habitLogResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  habit: z.object({
    id: z.number(),
    name: z.string(),
    type: z.enum(['BUILD', 'BREAK']),
  }),
  log: z.object({
    id: z.number(),
    completed: z.boolean(),
    eventDate: z.string(),
    quantity: z.number().nullable(),
    unit: z.enum(allowedUnits).nullable(),
    timeOfDay: z.string().nullable(),
    notes: z.string().nullable(),
  }),
})

export type HabitLogResponse = z.infer<typeof habitLogResponseSchema>

// ============================================================================
// QUERY TOOL SCHEMAS
// ============================================================================

/**
 * Tool: Get existing habits for a user
 */
export const getExistingHabitsSchema = z.object({
  userId: z.string().optional().describe('User ID to fetch habits for (defaults to default_user)'),
})

export type GetExistingHabitsParams = z.infer<typeof getExistingHabitsSchema>

/**
 * Tool: Create or update a habit
 */
export const createOrUpdateHabitSchema = z.object({
  userId: z.string().optional().describe('User ID (defaults to default_user)'),
  name: z.string().min(1).describe('Habit name (normalized, lowercase)'),
  type: z.enum(['BUILD', 'BREAK']).describe('BUILD = cultivate, BREAK = avoid'),
})

export type CreateOrUpdateHabitParams = z.infer<typeof createOrUpdateHabitSchema>

/**
 * Tool: Create a habit log entry
 */
export const createHabitLogSchema = z.object({
  habitId: z.number().describe('The habit ID to log for'),
  completed: z.boolean().describe('Whether the habit was completed/avoided'),
  eventDate: z.string().describe('ISO date string when the habit occurred'),
  quantity: z.number().nullable().optional().describe('Optional numeric quantity'),
  unit: z.enum(allowedUnits).nullable().optional().describe('Optional unit - must be normalized'),
  timeOfDay: z.string().nullable().optional().describe('Optional time of day'),
  notes: z.string().nullable().optional().describe('Optional notes'),
})

export type CreateHabitLogParams = z.infer<typeof createHabitLogSchema>

/**
 * Tool: Get habit logs with optional filtering
 */
export const getHabitLogsSchema = z.object({
  habitName: z.string().describe('Name of the habit to fetch logs for'),
  userId: z.string().optional().describe('User ID (defaults to default_user)'),
  limit: z.number().optional().describe('Maximum number of logs to return (defaults to 100)'),
  startDate: z.string().optional().describe('ISO date string - filter logs from this date'),
  endDate: z.string().optional().describe('ISO date string - filter logs until this date'),
})

export type GetHabitLogsParams = z.infer<typeof getHabitLogsSchema>

/**
 * Tool: Calculate current streak for a habit
 */
export const calculateStreakSchema = z.object({
  habitName: z.string().describe('Name of the habit to calculate streak for'),
  userId: z.string().optional().describe('User ID (defaults to default_user)'),
})

export type CalculateStreakParams = z.infer<typeof calculateStreakSchema>

/**
 * Tool: Find last occurrence of a habit
 */
export const findLastOccurrenceSchema = z.object({
  habitName: z.string().describe('Name of the habit to find last occurrence for'),
  userId: z.string().optional().describe('User ID (defaults to default_user)'),
})

export type FindLastOccurrenceParams = z.infer<typeof findLastOccurrenceSchema>

/**
 * Tool: Get comprehensive statistics for a habit
 */
export const getHabitStatsSchema = z.object({
  habitName: z.string().describe('Name of the habit to get statistics for'),
  userId: z.string().optional().describe('User ID (defaults to default_user)'),
  startDate: z.string().optional().describe('ISO date string - calculate stats from this date'),
  endDate: z.string().optional().describe('ISO date string - calculate stats until this date'),
})

export type GetHabitStatsParams = z.infer<typeof getHabitStatsSchema>

// ============================================================================
// RESPONSE TYPE HELPERS
// ============================================================================

/**
 * Helper to create a success response for habit logging
 */
export function createSuccessResponse(
  habit: { id: number; name: string; type: 'BUILD' | 'BREAK' },
  log: {
    id: number
    completed: boolean
    eventDate: Date
    quantity: number | null
    unit: string | null
    timeOfDay: string | null
    notes: string | null
  }
): HabitLogResponse {
  return {
    success: true,
    message: `Successfully logged habit: ${habit.name}`,
    habit: {
      id: habit.id,
      name: habit.name,
      type: habit.type,
    },
    log: {
      id: log.id,
      completed: log.completed,
      eventDate: log.eventDate.toISOString(),
      quantity: log.quantity,
      unit: log.unit,
      timeOfDay: log.timeOfDay,
      notes: log.notes,
    },
  }
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(message: string) {
  return {
    success: false,
    error: message,
  }
}
