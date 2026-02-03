# Habit Tracking API Documentation

Natural language habit tracking system with automatic habit type inference, semantic matching, and intelligent analytics.

## Table of Contents
- [Overview](#overview)
- [Endpoints](#endpoints)
- [Habit Types](#habit-types)
- [API Examples](#api-examples)
- [Edge Cases](#edge-cases)
- [Testing](#testing)

---

## Overview

The Habit Tracking API enables users to:
- **Log habits** using natural language ("ran 5 miles this morning", "no drinking today")
- **Query analytics** conversationally ("how many consecutive days have I run?")
- **Automatic habit creation** - no need to pre-define habits
- **Semantic matching** - prevents duplicate habits ("jogging" and "running" are the same)
- **Flexible tracking** - binary (yes/no), quantities with units, time of day

### Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. POST /habits/log
Log a habit through natural language input.

**Parameters:**
- `prompt` (required, query string): Natural language description of the habit

**Response:** Structured JSON confirmation

**Example:**
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=ran%205%20miles%20this%20morning"
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged habit: running",
  "habit": {
    "id": 1,
    "name": "running",
    "type": "BUILD"
  },
  "log": {
    "id": 123,
    "completed": true,
    "eventDate": "2026-02-03T00:00:00.000Z",
    "quantity": 5,
    "unit": "miles",
    "timeOfDay": "morning",
    "notes": null
  }
}
```

---

### 2. GET /habits/query
Query habit analytics using natural language.

**Parameters:**
- `prompt` (required, query string): Natural language question about habits

**Response:** Streaming conversational text

**Example:**
```bash
curl "http://localhost:3000/habits/query?prompt=how%20many%20consecutive%20days%20have%20I%20run"
```

**Response (streaming text):**
```
You've been running for 7 consecutive days! Your current streak started on
January 27th and you've logged runs every day since then. Keep up the great work!
```

---

### 3. GET /habits/list
List all user habits with statistics.

**Parameters:** None

**Response:** JSON array of habits with stats

**Example:**
```bash
curl "http://localhost:3000/habits/list"
```

**Response:**
```json
{
  "habits": [
    {
      "id": 1,
      "name": "running",
      "type": "BUILD",
      "totalLogs": 7,
      "currentStreak": 7,
      "lastLogged": "2026-02-03T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "drinking",
      "type": "BREAK",
      "totalLogs": 19,
      "currentStreak": 19,
      "lastLogged": "2026-02-03T00:00:00.000Z"
    }
  ]
}
```

---

## Habit Types

### BUILD Habits (Positive behaviors to cultivate)
Examples: running, reading, meditating, exercising, drinking water

**Completion Logic:**
- `completed: true` = "did it"
- `completed: false` = "didn't do it"

**Example Inputs:**
- "ran 5 miles this morning" → `completed: true`
- "didn't run today" → `completed: false`
- "went jogging for 30 minutes" → `completed: true`

**Streak Calculation:** Consecutive days with `completed: true`

---

### BREAK Habits (Negative behaviors to avoid)
Examples: drinking (alcohol), smoking, junk food, social media

**Completion Logic:**
- `completed: true` = "successfully avoided"
- `completed: false` = "gave in to the habit"

**Example Inputs:**
- "log no drinking habit" → `completed: true` (successfully avoided)
- "didn't smoke today" → `completed: true` (successfully avoided)
- "had 2 beers last night" → `completed: false` (gave in)

**Streak Calculation:** Consecutive days of successful avoidance (`completed: true`)

---

## API Examples

### Logging Examples

#### 1. Simple Binary Tracking (BUILD)
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=went%20for%20a%20run"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "running", "type": "BUILD" },
  "log": { "completed": true, "eventDate": "2026-02-03T00:00:00.000Z" }
}
```

---

#### 2. Quantity Tracking (BUILD)
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=read%2045%20pages%20before%20bed"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "reading before bed", "type": "BUILD" },
  "log": {
    "completed": true,
    "quantity": 45,
    "unit": "pages",
    "timeOfDay": "night"
  }
}
```

---

#### 3. Duration Tracking (BUILD)
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=meditated%20for%2020%20minutes%20this%20morning"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "meditating", "type": "BUILD" },
  "log": {
    "completed": true,
    "quantity": 20,
    "unit": "minutes",
    "timeOfDay": "morning"
  }
}
```

---

#### 4. BREAK Habit - Successfully Avoided
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=no%20drinking%20today"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "drinking", "type": "BREAK" },
  "log": {
    "completed": true,
    "notes": "User logged: no drinking today"
  }
}
```

---

#### 5. BREAK Habit - Gave In
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=had%203%20drinks%20last%20night"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "drinking", "type": "BREAK" },
  "log": {
    "completed": false,
    "quantity": 3,
    "unit": "drinks",
    "timeOfDay": "night",
    "eventDate": "2026-02-02T00:00:00.000Z"
  }
}
```

---

#### 6. Retroactive Logging
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=ran%203%20miles%20yesterday%20afternoon"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "running", "type": "BUILD" },
  "log": {
    "completed": true,
    "eventDate": "2026-02-02T00:00:00.000Z",
    "quantity": 3,
    "unit": "miles",
    "timeOfDay": "afternoon"
  }
}
```

---

#### 7. Negative Logging (BUILD)
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=didn%27t%20read%20before%20bed"
```

**Response:**
```json
{
  "success": true,
  "habit": { "name": "reading before bed", "type": "BUILD" },
  "log": {
    "completed": false,
    "timeOfDay": "night"
  }
}
```

---

### Query Examples

#### 1. Current Streak
```bash
curl "http://localhost:3000/habits/query?prompt=how%20many%20consecutive%20days%20have%20I%20run"
```

**Response:**
```
You've been running for 7 consecutive days! Your current streak started on
January 27th and you've logged runs every day since then. Keep up the great work!
```

---

#### 2. Last Occurrence (BREAK Habit)
```bash
curl "http://localhost:3000/habits/query?prompt=when%20did%20I%20last%20have%20a%20drink"
```

**Response:**
```
You last had a drink on January 15th - that's 19 days ago! You've successfully
avoided drinking for over two and a half weeks. Amazing progress on breaking
this habit!
```

---

#### 3. Statistics
```bash
curl "http://localhost:3000/habits/query?prompt=show%20my%20running%20stats"
```

**Response:**
```
You've logged 15 running sessions with a 87% completion rate. Your current
streak is 7 days, and your longest streak was 12 days back in January.
You've run a total of 63 miles this month!
```

---

## Edge Cases

### 1. Semantic Matching
The system prevents habit fragmentation by matching semantically similar inputs to existing habits.

**Example:**
```bash
# First log creates "running" habit
curl -X POST "http://localhost:3000/habits/log?prompt=went%20for%20a%20run"

# These all match the existing "running" habit:
curl -X POST "http://localhost:3000/habits/log?prompt=went%20jogging"
curl -X POST "http://localhost:3000/habits/log?prompt=did%20a%205k"
curl -X POST "http://localhost:3000/habits/log?prompt=ran%20this%20morning"
```

All map to the same `"running"` habit - no duplicates created.

---

### 2. Ambiguous Context
The system uses context to distinguish between habits with similar words.

**Example:**
```bash
# Creates "drinking" (BREAK) - alcohol
curl -X POST "http://localhost:3000/habits/log?prompt=no%20drinking%20today"

# Creates "drinking water" (BUILD) - water
curl -X POST "http://localhost:3000/habits/log?prompt=drank%208%20glasses%20of%20water"
```

Two separate habits:
- `"drinking"` (BREAK) - alcohol avoidance
- `"drinking water"` (BUILD) - hydration

---

### 3. Multiple Logs Same Day
Multiple logs on the same day don't break streaks.

**Example:**
```bash
# Morning run
curl -X POST "http://localhost:3000/habits/log?prompt=ran%203%20miles%20this%20morning"

# Evening run (same day)
curl -X POST "http://localhost:3000/habits/log?prompt=ran%202%20miles%20this%20evening"

# Streak still counts as 1 day, not 2
```

The analytics utilities normalize logs by day, keeping the most recent completed log.

---

### 4. Retroactive Date Parsing
Natural date references are parsed correctly.

**Supported Formats:**
- "yesterday" → previous calendar day
- "last night" → previous day (even if after midnight)
- "this morning" → today
- "3 days ago" → calculated date
- "Monday" → most recent Monday

**Example:**
```bash
curl -X POST "http://localhost:3000/habits/log?prompt=meditated%20yesterday%20morning"
# eventDate: "2026-02-02T00:00:00.000Z"

curl -X POST "http://localhost:3000/habits/log?prompt=ran%20last%20night"
# eventDate: "2026-02-02T00:00:00.000Z"
```

---

## Error Handling

### Missing Prompt
```bash
curl -X POST "http://localhost:3000/habits/log"
```

**Response (400):**
```json
{
  "success": false,
  "error": "Missing prompt parameter"
}
```

---

### Invalid Endpoint
```bash
curl "http://localhost:3000/habits/invalid"
```

**Response (404):**
```
404 Not Found
```

---

## Testing

### Unit Tests
Run analytics utility unit tests:
```bash
bun test src/lib/habit-analytics.test.ts
```

**Coverage:**
- 33 tests covering streak calculations, date utilities, statistics

---

### Integration Tests
Run full integration tests (requires server running):
```bash
# Terminal 1: Start server
bun run dev

# Terminal 2: Run tests
bun test src/routes/habits.integration.test.ts
```

**Coverage:**
- 14 integration tests covering all endpoints
- 77 assertions validating real behavior
- Tests semantic matching, retroactive logging, edge cases

---

## Key Features

✅ **Zero Configuration** - Habits auto-created on first log
✅ **Semantic Matching** - Prevents duplicate habits
✅ **Intelligent Type Inference** - Automatically classifies BUILD vs BREAK
✅ **Flexible Tracking** - Binary, quantities, durations, any unit
✅ **Retroactive Logging** - Log past events naturally
✅ **Conversational Queries** - Natural language analytics
✅ **Accurate Streaks** - Handles gaps, same-day logs, completion logic

---

## Architecture

### Technology Stack
- **Framework:** Hono
- **AI:** OpenAI GPT-4 (via Vercel AI SDK)
- **Database:** Prisma + SQLite
- **Validation:** Zod
- **Testing:** Bun test runner

### File Structure
```
src/
├── routes/
│   └── habits.ts                      # Main endpoints + tools
├── lib/
│   ├── habit-analytics.ts             # Streak calculations
│   └── habit-analytics.test.ts        # Unit tests
├── prompts/
│   └── habit-tracking-prompts.ts      # System prompts
├── types/
│   └── habit-schemas.ts               # Zod schemas
prisma/
├── schema.prisma                       # Database models
└── seed.ts                            # Sample data
```

---

## Database Schema

### Habit
- `id` - Unique identifier
- `userId` - User identifier (default: "default_user")
- `name` - Normalized habit name (e.g., "running", "drinking")
- `type` - HabitType enum: BUILD or BREAK
- `createdAt` / `updatedAt` - Timestamps

**Indexes:** `[userId, name]` (unique), `[userId, type]`

### HabitLog
- `id` - Unique identifier
- `habitId` - Foreign key to Habit
- `completed` - Boolean (true = did it / successfully avoided)
- `eventDate` - When the habit occurred (Date)
- `loggedAt` - When it was logged (Date)
- `quantity` - Optional numeric value (Float)
- `unit` - Optional unit string (e.g., "miles", "minutes", "pages")
- `timeOfDay` - Optional time (e.g., "morning", "afternoon", "evening", "night")
- `notes` - Optional text notes

**Indexes:** `[habitId, eventDate]`, `[habitId, completed]`, `[eventDate]`

---

## Next Steps

Future enhancements could include:
- Multi-user support with authentication
- Habit editing and deletion
- Goal setting (e.g., "run 5 times per week")
- Reminders and notifications
- Data export (CSV, JSON)
- Visualizations (charts, graphs)
- AI insights (e.g., "your best running days are Mondays")

---

## Support

For issues or questions:
- Check the integration tests for examples: `src/routes/habits.integration.test.ts`
- Review the PRD: `PRD.md`
- See analytics implementation: `src/lib/habit-analytics.ts`
