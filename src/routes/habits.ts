import { Hono } from 'hono'
import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { generateObject } from 'ai'
import { streamText as honoStreamText } from 'hono/streaming'
import { prisma } from '../lib/db'

import {
  habitLogParseSchema,
  getHabitLogsSchema,
  calculateStreakSchema,
  findLastOccurrenceSchema,
  getHabitStatsSchema,
  createSuccessResponse,
  createErrorResponse,
} from '../types/habit-schemas'

import {
  buildLoggingPrompt,
  buildQueryPrompt,
} from '../prompts/habit-tracking-prompts'

import {
  calculateCurrentStreak,
  calculateLongestStreak,
  findLastOccurrence,
  calculateStats,
  filterLogsByDateRange,
} from '../lib/habit-analytics'

const app = new Hono()

// ============================================================================
// TOOLS FOR QUERY ENDPOINT
// ============================================================================

/**
 * Tool: Get habit logs with optional filtering
 */
const getHabitLogsTool = tool({
  description:
    'Fetch habit logs for a specific habit with optional date range filtering',
  parameters: getHabitLogsSchema,
  execute: async ({
    habitName,
    userId,
    limit,
    startDate,
    endDate,
  }) => {
    // Find the habit first
    const habit = await prisma.habit.findUnique({
      where: { userId_name: { userId, name: habitName } },
    })

    if (!habit) {
      throw new Error(`Habit "${habitName}" not found`)
    }

    // Build the where clause
    const where: any = { habitId: habit.id }

    if (startDate || endDate) {
      where.eventDate = {}
      if (startDate) where.eventDate.gte = new Date(startDate)
      if (endDate) where.eventDate.lte = new Date(endDate)
    }

    const logs = await prisma.habitLog.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      take: limit,
    })

    return {
      habit: { id: habit.id, name: habit.name, type: habit.type },
      logs,
    }
  },
})

/**
 * Tool: Calculate current streak for a habit
 */
const calculateStreakTool = tool({
  description: 'Calculate the current streak (consecutive days) for a habit',
  parameters: calculateStreakSchema,
  execute: async ({
    habitName,
    userId,
  }) => {
    const habit = await prisma.habit.findUnique({
      where: { userId_name: { userId, name: habitName } },
      include: { logs: { orderBy: { eventDate: 'asc' } } },
    })

    if (!habit) {
      throw new Error(`Habit "${habitName}" not found`)
    }

    const streak = calculateCurrentStreak(habit.logs)

    return {
      habitName: habit.name,
      habitType: habit.type,
      currentStreak: streak
        ? {
          length: streak.length,
          startDate: streak.startDate.toISOString(),
          endDate: streak.endDate.toISOString(),
        }
        : null,
    }
  },
})

/**
 * Tool: Find last occurrence of a habit
 */
const findLastOccurrenceTool = tool({
  description:
    'Find the last time a habit was completed (BUILD) or given in to (BREAK)',
  parameters: findLastOccurrenceSchema,
  execute: async ({
    habitName,
    userId,
  }) => {
    const habit = await prisma.habit.findUnique({
      where: { userId_name: { userId, name: habitName } },
      include: { logs: { orderBy: { eventDate: 'desc' } } },
    })

    if (!habit) {
      throw new Error(`Habit "${habitName}" not found`)
    }

    const lastOccurrence = findLastOccurrence(habit.logs, habit.type)

    return {
      habitName: habit.name,
      habitType: habit.type,
      lastOccurrence: lastOccurrence
        ? {
          eventDate: lastOccurrence.eventDate.toISOString(),
          completed: lastOccurrence.completed,
          quantity: lastOccurrence.quantity,
          unit: lastOccurrence.unit,
          timeOfDay: lastOccurrence.timeOfDay,
          notes: lastOccurrence.notes,
        }
        : null,
    }
  },
})

/**
 * Tool: Get comprehensive statistics for a habit
 */
const getHabitStatsTool = tool({
  description:
    'Get comprehensive statistics including completion rate, streaks, and date ranges',
  parameters: getHabitStatsSchema,
  execute: async ({
    habitName,
    userId,
    startDate,
    endDate,
  }) => {
    const habit = await prisma.habit.findUnique({
      where: { userId_name: { userId, name: habitName } },
      include: { logs: { orderBy: { eventDate: 'asc' } } },
    })

    if (!habit) {
      throw new Error(`Habit "${habitName}" not found`)
    }

    // Filter logs by date range if provided
    let logs = habit.logs
    if (startDate || endDate) {
      logs = filterLogsByDateRange(
        logs,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
    }

    const stats = calculateStats(logs)

    return {
      habitName: habit.name,
      habitType: habit.type,
      stats: {
        totalLogs: stats.totalLogs,
        completionRate: stats.completionRate,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        firstLogDate: stats.firstLogDate?.toISOString() ?? null,
        lastLogDate: stats.lastLogDate?.toISOString() ?? null,
      },
    }
  },
})

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /habits/log
 * Log a habit through natural language
 * Returns structured JSON confirmation
 */
app.post('/log', async (c) => {
  try {
    const prompt = c.req.query('prompt')

    if (!prompt) {
      return c.json(createErrorResponse('Missing prompt parameter'), 400)
    }

    const userId = 'default_user'

    // First, get existing habits to provide context for semantic matching
    const existingHabits = await prisma.habit.findMany({
      where: { userId },
      select: { name: true, type: true },
    })

    // Parse the natural language input using structured output
    const { object: parsedLog } = await generateObject({
      model: openai('gpt-4o'),
      schema: habitLogParseSchema,
      prompt: buildLoggingPrompt(prompt, existingHabits),
    })

    // Create or get the habit
    const habit = await prisma.habit.upsert({
      where: {
        userId_name: { userId, name: parsedLog.habitName },
      },
      update: {}, // Don't update if exists
      create: {
        userId,
        name: parsedLog.habitName,
        type: parsedLog.habitType,
      },
    })

    // Create the log entry
    const log = await prisma.habitLog.create({
      data: {
        habitId: habit.id,
        completed: parsedLog.completed,
        eventDate: new Date(parsedLog.eventDate),
        quantity: parsedLog.quantity,
        unit: parsedLog.unit,
        timeOfDay: parsedLog.timeOfDay,
        notes: parsedLog.notes,
      },
    })

    // Return success response
    return c.json(createSuccessResponse(habit, log))
  } catch (error) {
    console.error('Error logging habit:', error)
    return c.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error'
      ),
      500
    )
  }
})

/**
 * GET /habits/query
 * Query habit analytics through natural language
 * Returns streaming conversational text
 */
app.get('/query', async (c) => {
  try {
    const prompt = c.req.query('prompt')

    if (!prompt) {
      return c.json({ error: 'Missing prompt parameter' }, 400)
    }

    const userId = 'default_user'

    // Stream the response
    const result = streamText({
      model: openai('gpt-4o'),
      prompt: buildQueryPrompt(prompt),
      tools: {
        getHabitLogs: getHabitLogsTool,
        calculateStreak: calculateStreakTool,
        findLastOccurrence: findLastOccurrenceTool,
        getHabitStats: getHabitStatsTool,
      },
    })

    return honoStreamText(c, async (stream) => {
      for await (const chunk of result.textStream) {
        await stream.write(chunk)
      }
    })
  } catch (error) {
    console.error('Error querying habits:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
})

/**
 * GET /habits/list (Optional)
 * List all habits for a user
 */
app.get('/list', async (c) => {
  try {
    const userId = 'default_user'

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { eventDate: 'desc' },
          take: 1,
        },
        _count: {
          select: { logs: true },
        },
      },
    })

    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        const logs = await prisma.habitLog.findMany({
          where: { habitId: habit.id },
          orderBy: { eventDate: 'asc' },
        })

        const currentStreak = calculateCurrentStreak(logs)

        return {
          id: habit.id,
          name: habit.name,
          type: habit.type,
          totalLogs: habit._count.logs,
          currentStreak: currentStreak?.length ?? 0,
          lastLogged: habit.logs[0]?.eventDate.toISOString() ?? null,
        }
      })
    )

    return c.json({ habits: habitsWithStats })
  } catch (error) {
    console.error('Error listing habits:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
})

export default app
