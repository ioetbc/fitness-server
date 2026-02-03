import { describe, test, expect, beforeAll } from 'bun:test'

const BASE_URL = 'http://localhost:3000'

describe('Habit Tracking Integration Tests', () => {
  beforeAll(() => {
    console.log('⚠️  Make sure the dev server is running: bun run dev')
  })

  describe('POST /habits/log - Logging habits', () => {
    test('Test 1: Log BREAK habit - no drinking (completed=true)', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('log no drinking habit')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('drinking')
      expect(data.habit.type).toBe('BREAK')
      expect(data.log.completed).toBe(true) // Successfully avoided
      expect(data.log.notes).toContain('no drinking habit')
    })

    test('Test 2: Log BUILD habit with quantity - ran 5 miles', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('ran 5 miles this morning')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('running')
      expect(data.habit.type).toBe('BUILD')
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(5)
      expect(data.log.unit).toBe('miles')
      expect(data.log.timeOfDay).toBe('morning')
    })

    test('Test 3: Log BUILD habit not completed - didn\'t read', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent("didn't read before bed")}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('reading before bed')
      expect(data.habit.type).toBe('BUILD')
      expect(data.log.completed).toBe(false) // Did not complete
      expect(data.log.timeOfDay).toBe('night')
    })

    test('Test 4: Retroactive logging - yesterday', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('ran 3 miles yesterday afternoon')}`,
        { method: 'POST' }
      )

      const data = await response.json()
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('running')
      expect(data.log.eventDate).toContain(yesterdayStr)
      expect(data.log.quantity).toBe(3)
      expect(data.log.timeOfDay).toBe('afternoon')
    })

    test('Test 5: Semantic matching - different phrasing for running', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('went jogging for 45 minutes')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('running') // Should match existing "running" habit
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(45)
      expect(data.log.unit).toBe('minutes')
    })

    test('Test 6: Multiple logs same day - meditating', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('meditated for 10 minutes this morning')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('meditating')
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(10)
      expect(data.log.unit).toBe('minutes')
      expect(data.log.timeOfDay).toBe('morning')
    })

    test('Test 7: BREAK habit - gave in (completed=false)', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('had 2 beers last night')}`,
        { method: 'POST' }
      )

      const data = await response.json()
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('drinking')
      expect(data.habit.type).toBe('BREAK')
      expect(data.log.completed).toBe(false) // Gave in to habit
      expect(data.log.quantity).toBe(2)
      expect(data.log.unit).toMatch(/drink|beer/) // "drinks", "beers", etc.
      expect(data.log.eventDate).toContain(yesterdayStr)
      expect(data.log.timeOfDay).toBe('night')
    })

    test('Test 8: Ambiguous habit - drinking water (BUILD not BREAK)', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('drank 8 glasses of water today')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('drinking water')
      expect(data.habit.type).toBe('BUILD') // Water is BUILD, alcohol is BREAK
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(8)
      expect(data.log.unit).toBe('glasses')
    })

    test('Test 9: New habit creation - guitar practice', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('practiced guitar for 30 minutes')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toContain('guitar')
      expect(data.habit.type).toBe('BUILD')
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(30)
      expect(data.log.unit).toBe('minutes')
    })

    test('Test 10: Semantic matching - stayed sober (BREAK habit)', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('stayed sober today')}`,
        { method: 'POST' }
      )

      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('drinking') // Should match existing drinking habit
      expect(data.habit.type).toBe('BREAK')
      expect(data.log.completed).toBe(true) // Successfully avoided
    })

    test('Test 11: Complex input - read 45 pages before bed last night', async () => {
      const response = await fetch(
        `${BASE_URL}/habits/log?prompt=${encodeURIComponent('read 45 pages before bed last night')}`,
        { method: 'POST' }
      )

      const data = await response.json()
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      expect(data.success).toBe(true)
      expect(data.habit.name).toBe('reading before bed')
      expect(data.log.completed).toBe(true)
      expect(data.log.quantity).toBe(45)
      expect(data.log.unit).toBe('pages')
      expect(data.log.timeOfDay).toBe('night')
      expect(data.log.eventDate).toContain(yesterdayStr)
    })
  })

  describe('GET /habits/list - List all habits', () => {
    test('Should return list of habits with stats', async () => {
      const response = await fetch(`${BASE_URL}/habits/list`)
      const data = await response.json()

      expect(data.habits).toBeArray()
      expect(data.habits.length).toBeGreaterThan(0)

      // Check structure of first habit
      const habit = data.habits[0]
      expect(habit).toHaveProperty('id')
      expect(habit).toHaveProperty('name')
      expect(habit).toHaveProperty('type')
      expect(habit).toHaveProperty('totalLogs')
      expect(habit).toHaveProperty('currentStreak')
      expect(habit.type).toMatch(/BUILD|BREAK/)
    })

    test('Should include running habit with streak', async () => {
      const response = await fetch(`${BASE_URL}/habits/list`)
      const data = await response.json()

      const runningHabit = data.habits.find((h: any) => h.name === 'running')
      expect(runningHabit).toBeDefined()
      expect(runningHabit.type).toBe('BUILD')
      expect(runningHabit.totalLogs).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    test('Should return error for missing prompt', async () => {
      const response = await fetch(`${BASE_URL}/habits/log`, { method: 'POST' })
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(response.status).toBe(400)
    })
  })
})
