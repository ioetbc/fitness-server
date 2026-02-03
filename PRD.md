# Product Requirements Document: Natural Language Habit Tracking System

## Overview
Build a habit tracking system with natural language logging and querying capabilities, enabling users to track any habit through conversational commands and receive intelligent analytics responses.

## Objectives
- Enable habit tracking through natural language ("log no drinking habit", "ran 5 miles this morning")
- Support natural language queries ("how many consecutive days have I run", "when did I last have a drink")
- Auto-create habits on first log without pre-definition
- Track both habits to build (running, reading) and habits to break (drinking, smoking)
- Provide flexible data capture: binary tracking, quantities/metrics, time of day
- Maintain complete separation from existing video recommendation system

---

## User Stories

### Logging Habits
1. **As a user**, I want to log that I avoided a bad habit by saying "log no drinking habit", so the system records my success
2. **As a user**, I want to log exercise with metrics like "ran 5 miles this morning" and have it capture quantity, unit, and time
3. **As a user**, I want to log a missed habit with "didn't read before bed" and have it recorded accurately
4. **As a user**, I want habits to be created automatically on first log without having to set them up first

### Querying Analytics
5. **As a user**, I want to ask "how many consecutive days have I run" and get my current streak
6. **As a user**, I want to ask "when did I last have a drink" and see the exact date
7. **As a user**, I want to receive encouraging, conversational responses to my queries
8. **As a user**, I want the system to understand the difference between building good habits and breaking bad ones

### Flexibility
9. **As a user**, I want to track absolutely anything - miles run, glasses of water, minutes meditated, pages read
10. **As a user**, I want to log habits retroactively with phrases like "ran yesterday" or "meditated last night"

---

## Functional Requirements

### FR1: Natural Language Logging
- **FR1.1**: Accept natural language input for habit logging via POST /habits/log endpoint
- **FR1.2**: Parse and extract:
  - Habit name (normalized)
  - Completion status (did/didn't do it)
  - Habit type (BUILD or BREAK)
  - Optional quantity and unit
  - Optional time of day
  - Event date (default to today)
- **FR1.3**: Auto-create habits if they don't exist
- **FR1.4**: Return structured JSON confirmation with parsed data

**Examples:**
- Input: "log no drinking habit"
  - Creates/finds BREAK habit "drinking"
  - Records completed=true (successfully avoided)
- Input: "ran 5 miles this morning"
  - Creates/finds BUILD habit "running"
  - Records completed=true, quantity=5, unit="miles", timeOfDay="morning"

### FR2: Habit Type Distinction
- **FR2.1**: Support two habit types:
  - **BUILD**: Positive habits to cultivate (running, reading, meditating)
  - **BREAK**: Negative habits to avoid (drinking, smoking, junk food)
- **FR2.2**: Interpret completion status based on type:
  - BUILD habits: completed=true means "did it", false means "didn't do it"
  - BREAK habits: completed=true means "successfully avoided", false means "gave in"
- **FR2.3**: Use LLM intelligence to infer type on first log
- **FR2.4**: Persist type in database for consistency on subsequent logs

### FR3: Natural Language Querying
- **FR3.1**: Accept analytics questions via GET /habits/query endpoint
- **FR3.2**: Support query types:
  - Streak calculation ("how many consecutive days have I run")
  - Last occurrence ("when did I last have a drink")
  - Statistics ("show my reading stats")
  - Completion rates ("how often do I exercise")
- **FR3.3**: Return streaming conversational text responses
- **FR3.4**: Provide specific dates, numbers, and encouraging context

### FR4: Flexible Data Capture
- **FR4.1**: Support binary tracking (yes/no, did/didn't)
- **FR4.2**: Support quantity tracking with any unit:
  - Distance: "5 miles", "3 kilometers"
  - Volume: "2 glasses", "8 cups"
  - Duration: "30 minutes", "2 hours"
  - Count: "50 pages", "10 push-ups"
- **FR4.3**: Support time of day capture: morning, afternoon, evening, night, or specific times
- **FR4.4**: Support optional notes/context
- **FR4.5**: Allow retroactive logging with date parsing

### FR5: Analytics Calculations
- **FR5.1**: Calculate current streak (consecutive days with completed=true)
- **FR5.2**: Handle streak breaks properly (completed=false or date gap > 1 day)
- **FR5.3**: Find last occurrence of completed habit
- **FR5.4**: Compute comprehensive statistics:
  - Total logs
  - Completion rate
  - Current streak
  - Longest streak
  - First and last log dates
- **FR5.5**: Support date range queries

### FR6: Habit Management
- **FR6.1**: Store habits with normalized names (lowercase, singular when possible)
- **FR6.2**: Allow same habit with different phrasing ("went for a run" vs "ran" vs "running")
- **FR6.3**: Support multiple logs per day without breaking streaks
- **FR6.4**: Optional: Provide GET /habits/list endpoint for viewing all habits

---

## Non-Functional Requirements

### NFR1: Performance
- Database queries optimized with indexes on:
  - [habitId, eventDate] for habit history
  - [habitId, completed] for streak calculations
  - [eventDate] for date-range queries
- Default date range limit of 90 days for analytics
- Query limit of 100 logs default for performance

### NFR2: Data Integrity
- Unique constraint on [userId, habitName] prevents duplicates
- Cascade delete: removing habit deletes all logs
- Separate eventDate (when occurred) from loggedAt (when recorded)
- All dates stored in UTC

### NFR3: Flexibility
- No validation on unit types - accept any string
- quantity field as Float handles decimals
- No pre-defined habit categories
- Support for "absolutely anything"

### NFR4: Architecture
- Complete separation from video recommendation system
- Follow existing patterns: Hono + OpenAI + Vercel AI SDK + Prisma
- Tool-based execution with Zod validation
- Consistent with current codebase architecture

### NFR5: User Experience
- Conversational, encouraging responses
- Specific data (dates, numbers) in responses
- Helpful error messages for ambiguous inputs
- JSON confirmation responses for logging

---

## Database Schema

### Habit Model
```prisma
model Habit {
  id          Int         @id @default(autoincrement())
  userId      String      @default("default_user")
  name        String      // Normalized: "running", "drinking", "reading before bed"
  type        HabitType   // BUILD or BREAK
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  logs        HabitLog[]

  @@unique([userId, name])
  @@index([userId, type])
}
```

### HabitLog Model
```prisma
model HabitLog {
  id              Int       @id @default(autoincrement())
  habitId         Int
  habit           Habit     @relation(fields: [habitId], references: [id], onDelete: Cascade)
  completed       Boolean   // true = did it / successfully avoided
  loggedAt        DateTime  @default(now())
  eventDate       DateTime  // When habit actually occurred
  quantity        Float?    // Flexible metrics
  unit            String?   // "miles", "glasses", "minutes", etc.
  timeOfDay       String?   // "morning", "afternoon", "evening", "night"
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([habitId, eventDate])
  @@index([habitId, completed])
  @@index([eventDate])
}
```

### HabitType Enum
```prisma
enum HabitType {
  BUILD  // Habits to cultivate
  BREAK  // Habits to avoid
}
```

---

## API Specification

### POST /habits/log
**Purpose**: Log a habit through natural language

**Request:**
```
POST /habits/log?prompt=log%20no%20drinking%20habit
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged habit: drinking",
  "habit": {
    "id": 1,
    "name": "drinking",
    "type": "BREAK"
  },
  "log": {
    "id": 123,
    "completed": false,
    "eventDate": "2026-02-03T00:00:00Z",
    "quantity": null,
    "unit": null,
    "timeOfDay": null,
    "notes": "User logged: no drinking habit"
  }
}
```

**Execution**: Structured JSON output using Vercel AI SDK

**Tools**: getExistingHabits, createOrUpdateHabit, createHabitLog

### GET /habits/query
**Purpose**: Query habit analytics through natural language

**Request:**
```
GET /habits/query?prompt=how%20many%20consecutive%20days%20have%20I%20run
```

**Response (Streaming Text):**
```
You've been running for 7 consecutive days! Your streak started on January 27th
and you've logged runs every day since then. Keep up the great work!
```

**Execution**: Streaming text using Vercel AI SDK

**Tools**: getHabitLogs, calculateStreakTool, findLastOccurrenceTool, getHabitStatsTool

### GET /habits/list (Optional)
**Purpose**: List all user habits

**Response:**
```json
{
  "habits": [
    {
      "id": 1,
      "name": "running",
      "type": "BUILD",
      "totalLogs": 15,
      "currentStreak": 7,
      "lastLogged": "2026-02-03T08:00:00Z"
    }
  ]
}
```

---

## Key Behaviors & Edge Cases

### BUILD vs BREAK Logic (CRITICAL)

**BREAK Habits (avoid negative behaviors):**
- "log no drinking habit" → completed: true ✅ (successfully avoided)
- "didn't smoke today" → completed: true ✅ (successfully avoided)
- "had a drink" → completed: false ❌ (gave in to habit)
- Streak = consecutive days of successful avoidance

**BUILD Habits (cultivate positive behaviors):**
- "went for a run" → completed: true ✅ (did the habit)
- "read before bed" → completed: true ✅ (did the habit)
- "didn't run today" → completed: false ❌ (failed to do it)
- Streak = consecutive days of completion

### Habit Name Normalization
- "went on a run", "went for a run", "ran" → all normalize to "running"
- "had a drink", "drinking", "drank" → all normalize to "drinking"
- Preserve specificity when needed: "reading before bed" vs just "reading"
- Store lowercase, singular form when possible

### Date Handling
- "yesterday" → previous calendar day
- "last night" → if after midnight, still previous day
- "Monday" → most recent Monday
- "3 days ago" → calculate relative date
- Default to today if not specified

### Multiple Logs Same Day
- Allow multiple logs for same habit on same day
- Don't break streak for multiple same-day entries
- Don't double-count for streak calculation

### Type Inference
- First log: LLM infers from context
  - "drinking" → likely BREAK (alcohol)
  - "drinking water" → BUILD
  - "running" → BUILD
  - "smoking" → BREAK
- Subsequent logs: Use stored type from database
- Default to BUILD if truly ambiguous

---

## Success Metrics

### Primary Metrics
1. **Accuracy**: >95% correct habit type inference on first log
2. **Streak Accuracy**: 100% accurate consecutive day calculation
3. **Parse Success**: >90% of natural language inputs correctly parsed
4. **Response Time**: <2s for logging, <3s for queries

### User Experience Metrics
5. **Zero Pre-configuration**: All habits auto-created on first use
6. **Flexibility**: Support any quantity/unit combination
7. **Retroactive Logging**: Parse relative dates correctly
8. **Encouraging Responses**: Positive, specific feedback in queries

---

## Out of Scope (Future Enhancements)

### V2 Features
- Multi-user support with authentication
- Habit editing and deletion
- Goal setting ("run 5 times per week")
- Reminders and notifications
- Data export (CSV, JSON)

### V3 Features
- Habit templates and categories
- Social features (share streaks)
- Visualizations (charts, graphs)
- AI insights ("your best running days are Mondays")
- Third-party integrations (Apple Health, Fitbit)

---

## Technical Implementation Summary

### New Files
1. `src/prompts/habit-tracking-prompts.ts` - System prompts for parsing and analytics
2. `src/lib/habit-analytics.ts` - Streak calculation and statistics utilities
3. `src/types/habit-schemas.ts` - Zod validation schemas
4. `src/routes/habits.ts` - Main implementation (endpoints + tools)

### Modified Files
1. `prisma/schema.prisma` - Add Habit, HabitLog models and HabitType enum
2. `src/index.ts` - Mount habit routes
3. `prisma/seed.ts` - Add sample habit data

### Dependencies
- Existing: Hono, OpenAI, Vercel AI SDK, Prisma, Zod
- No new dependencies required

### Migration
```bash
bun run prisma migrate dev --name add_habit_tracking
bun run prisma db seed
```

---

## Testing Requirements

### Unit Tests
- Streak calculation with various scenarios
- Date parsing (yesterday, last night, relative dates)
- Habit name normalization
- Type inference logic

### Integration Tests
- Auto-creation on first log
- Correct type persistence across logs
- Multiple same-day logs
- Retroactive logging

### End-to-End Tests
- Complete logging flow: input → parse → store → confirm
- Complete query flow: input → analyze → respond
- BUILD habit scenarios
- BREAK habit scenarios
- Quantity tracking
- Time of day capture

### Test Cases (Examples)
1. "log no drinking habit" → BREAK, completed=true
2. "ran 5 miles this morning" → BUILD, quantity=5, unit="miles", timeOfDay="morning"
3. "didn't read before bed" → BUILD, completed=false
4. "how many consecutive days have I run" → accurate streak
5. "when did I last have a drink" → correct date
6. Same habit different phrasing → same normalized name
7. Multiple logs same day → doesn't break streak

---

## Risks & Mitigations

### Risk 1: Ambiguous Type Inference
- **Impact**: User says "drinking" - is it water (BUILD) or alcohol (BREAK)?
- **Mitigation**: LLM uses context clues; can add explicit syntax later ("log BUILD habit: drinking water")

### Risk 2: Parsing Errors
- **Impact**: Natural language is unpredictable; might misparse complex inputs
- **Mitigation**: Return parsed data in confirmation; user can verify; notes field preserves original input

### Risk 3: Streak Calculation Edge Cases
- **Impact**: Time zones, multiple logs, gaps could cause incorrect streaks
- **Mitigation**: Comprehensive unit tests; use UTC consistently; clear algorithm documentation

### Risk 4: Database Performance
- **Impact**: Large number of logs could slow queries
- **Mitigation**: Proper indexes; default date ranges; pagination for large datasets

---

## Launch Checklist

- [x] Database schema updated and migrated
- [x] Sample seed data created and tested
- [x] Analytics utilities implemented and unit tested
- [x] System prompts written with comprehensive examples
- [x] Logging endpoint implemented with all tools
- [x] Query endpoint implemented with all tools
- [x] Routes mounted in main app
- [x] All test cases passing
- [x] Edge cases handled (ambiguity, retroactive, same-day)
- [x] Documentation updated with API examples
- [x] Manual testing with curl completed

---

## Appendix: Example Interactions

### Example 1: First Time Logging a BREAK Habit
```
User: "log no drinking habit"

System Response:
{
  "success": true,
  "message": "Successfully logged habit: drinking",
  "habit": {
    "id": 1,
    "name": "drinking",
    "type": "BREAK"
  },
  "log": {
    "id": 1,
    "completed": true,
    "eventDate": "2026-02-03T00:00:00Z",
    "quantity": null,
    "unit": null,
    "timeOfDay": null,
    "notes": "User logged: no drinking habit"
  }
}

Database State:
- Habit "drinking" created with type BREAK
- Log created with completed=true (successfully avoided drinking)
```

### Example 2: Logging BUILD Habit with Metrics
```
User: "ran 5 miles this morning"

System Response:
{
  "success": true,
  "message": "Successfully logged habit: running",
  "habit": {
    "id": 2,
    "name": "running",
    "type": "BUILD"
  },
  "log": {
    "id": 2,
    "completed": true,
    "eventDate": "2026-02-03T00:00:00Z",
    "quantity": 5,
    "unit": "miles",
    "timeOfDay": "morning",
    "notes": null
  }
}

Database State:
- Habit "running" created with type BUILD
- Log created with completed=true, quantity=5, unit="miles", timeOfDay="morning"
```

### Example 3: Streak Query
```
User: "how many consecutive days have I run"

System Response (Streaming):
"You've been running for 7 consecutive days! Your current streak started on
January 27th and you've logged runs every day since then. That's fantastic
consistency - keep up the great work! 🎯"

Calculation:
- Fetched all logs for "running" habit
- Found 7 consecutive days with completed=true
- No gaps in dates, no completed=false entries
- Streak start: Jan 27, last log: Feb 3
```

### Example 4: Last Occurrence for BREAK Habit
```
User: "when did I last have a drink"

System Response (Streaming):
"You last had a drink on January 15th - that's 19 days ago! You've successfully
avoided drinking for over two and a half weeks. Amazing progress on breaking
this habit! 🌟"

Calculation:
- Fetched logs for "drinking" habit where completed=false (gave in)
- Most recent: Jan 15
- Today: Feb 3
- Days since: 19
- Encouraging message emphasizes the avoidance success
```
