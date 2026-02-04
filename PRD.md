     │ Problem Summary                                                              │
     │                                                                              │
     │ The habit tracking system has several prompt-related issues that cause       │
     │ incorrect responses:                                                         │
     │                                                                              │
     │ Query Issues                                                                 │
     │                                                                              │
     │ 1. "When did I last have a drink?" → Returns "I don't see any logs for the   │
     │ habit 'have a drink' yet"                                                    │
     │   - Root cause: Query prompt doesn't provide existing habit names, so LLM    │
     │ can't map "have a drink" → "drinking"                                        │
     │   - Tools search by exact name match, failing when user phrasing differs from│
     │  stored habit name                                                           │
     │ 2. "What's the longest I've gone without drinking?" → Same semantic matching │
     │ issue                                                                        │
     │   - Also missing guidance about longest streak calculations                  │
     │ 3. "How many kilometers have I run?" → Returns count of runs (6 times)       │
     │ instead of sum of kilometers                                                 │
     │   - Root cause: Prompt lacks instructions to aggregate quantity field when   │
     │ user asks about total units                                                  │
     │                                                                              │
     │ Logging Issues                                                               │
     │                                                                              │
     │ 1. "I ran 5k 3 days ago" → Unit stored inconsistently ("k", "km", or         │
     │ "kilometers")                                                                │
     │   - Root cause: No unit normalization in logging prompt                      │
     │   - Should always normalize to standard units (km, miles, minutes, etc.)     │
     │                                                                              │
     │ Solution Overview                                                            │
     │                                                                              │
     │ 1. Fix Query Prompt - Add Existing Habits Context                            │
     │                                                                              │
     │ File: src/prompts/habit-tracking-prompts.ts                                  │
     │                                                                              │
     │ The query prompt needs access to existing habit names for semantic matching. │
     │                                                                              │
     │ Changes:                                                                     │
     │ - Modify buildQueryPrompt() function to accept existing habits list          │
     │ - Add section to HABIT_QUERY_SYSTEM_PROMPT explaining semantic matching      │
     │ requirement                                                                  │
     │ - Include examples showing how to map user queries to actual habit names     │
     │                                                                              │
     │ Example:                                                                     │
     │ User has habits: "running" (BUILD), "drinking" (BREAK)                       │
     │ Query: "when did I last have a drink"                                        │
     │ → LLM should use "drinking" when calling findLastOccurrenceTool              │
     │                                                                              │
     │ 2. Fix Query Prompt - Add Quantity Aggregation Guidance                      │
     │                                                                              │
     │ File: src/prompts/habit-tracking-prompts.ts                                  │
     │                                                                              │
     │ Add explicit instructions for handling aggregate queries.                    │
     │                                                                              │
     │ Changes:                                                                     │
     │ - Add new query type section: "Aggregate Queries"                            │
     │ - Explain that questions like "how many [unit]" require summing quantity     │
     │ field                                                                        │
     │ - Provide examples showing the calculation logic                             │
     │                                                                              │
     │ Example:                                                                     │
     │ Query: "how many kilometers have I run"                                      │
     │ → Use getHabitLogs for "running"                                             │
     │ → Filter logs where unit matches (km, kilometers, k)                         │
     │ → Sum the quantity field                                                     │
     │ → Return: "You've run 42 kilometers total"                                   │
     │                                                                              │
     │ 3. Fix Query Prompt - Add Longest Streak Guidance                            │
     │                                                                              │
     │ File: src/prompts/habit-tracking-prompts.ts                                  │
     │                                                                              │
     │ Current prompt only mentions current streak, not longest streak.             │
     │                                                                              │
     │ Changes:                                                                     │
     │ - Update streak query examples to include longest streak                     │
     │ - Clarify that getHabitStatsTool returns both current and longest streaks    │
     │ - Add example response for longest streak queries                            │
     │                                                                              │
     │ 4. Add Unit Normalization to Logging Prompt                                  │
     │                                                                              │
     │ File: src/prompts/habit-tracking-prompts.ts                                  │
     │                                                                              │
     │ Add comprehensive unit standardization rules.                                │
     │                                                                              │
     │ Changes:                                                                     │
     │ - Add new section: "Unit Normalization" after line 80                        │
     │ - Define standard units for common categories:                               │
     │   - Distance: k/kms/kilometers → km, mi/mile/miles → miles                   │
     │   - Time: min/mins/minute → minutes, hr/hrs/hour → hours                     │
     │   - Weight: lb/lbs/pound → pounds, kg/kgs/kilogram → kg                      │
     │   - Volume: oz/ounces → oz, l/liter → liters                                 │
     │   - Count: pages, reps, drinks (already standardized)                        │
     │                                                                              │
     │ Example:                                                                     │
     │ Input: "ran 5k this morning"                                                 │
     │ → quantity: 5, unit: "km" (not "k")                                          │
     │                                                                              │
     │ Input: "meditated for 15 mins"                                               │
     │ → quantity: 15, unit: "minutes" (not "mins")                                 │
     │                                                                              │
     │ 5. Update Query Route Handler                                                │
     │                                                                              │
     │ File: src/routes/habits.ts                                                   │
     │                                                                              │
     │ The /query endpoint needs to fetch and pass existing habits.                 │
     │                                                                              │
     │ Changes:                                                                     │
     │ - Lines 277-311: Add database query to fetch existing habits                 │
     │ - Pass habits to buildQueryPrompt()                                          │
     │ - Similar to how /log endpoint fetches habits on lines 362-379               │
     │                                                                              │
     │ Implementation Details                                                       │
     │                                                                              │
     │ Critical Files to Modify                                                     │
     │                                                                              │
     │ 1. src/prompts/habit-tracking-prompts.ts (main changes)                      │
     │   - Line 270-350: Update HABIT_QUERY_SYSTEM_PROMPT                           │
     │   - Line 384-387: Update buildQueryPrompt() signature and implementation     │
     │   - Line 9-253: Add unit normalization section to HABIT_LOGGING_SYSTEM_PROMPT│
     │ 2. src/routes/habits.ts                                                      │
     │   - Lines 277-311: Update /query endpoint to fetch and pass habits           │
     │                                                                              │
     │ Prompt Changes Breakdown                                                     │
     │                                                                              │
     │ HABIT_QUERY_SYSTEM_PROMPT Updates                                            │
     │                                                                              │
     │ 1. Add Semantic Matching Section (after line 276):                           │
     │ ## CRITICAL: Semantic Habit Matching                                         │
     │                                                                              │
     │ You will be provided with a list of the user's existing habits. When they ask│
     │  about a habit, you MUST map their query to the actual habit name stored in  │
     │ the database.                                                                │
     │                                                                              │
     │ Examples:                                                                    │
     │ - User has habit "drinking" → queries "have a drink", "alcohol", "had drinks"│
     │  all map to "drinking"                                                       │
     │ - User has habit "running" → queries "jog", "went for a run", "did a 5k" all │
     │ map to "running"                                                             │
     │                                                                              │
     │ NEVER pass user's raw phrasing to tools - always use the actual habit name.  │
     │                                                                              │
     │ 2. Add Aggregate Query Section (after line 318):                             │
     │ 5. **Aggregate Queries (NEW)**                                               │
     │    - "how many kilometers have I run"                                        │
     │    - "total pages read this month"                                           │
     │    - Use getHabitLogs to fetch all logs                                      │
     │    - Filter where unit matches (handle variants: k/km/kilometers)            │
     │    - Sum the quantity field across all matching logs                         │
     │    - Return the total with proper unit                                       │
     │                                                                              │
     │ 3. Update Streak Examples (line 299-302):                                    │
     │   - Add "what's my longest meditation streak" example                        │
     │   - Clarify getHabitStatsTool returns both current and longest               │
     │ 4. Add Quantity Aggregation Example (after line 331):                        │
     │ Query: "how many kilometers have I run"                                      │
     │ Good Response: "You've run 42 kilometers across 6 runs since January 29th.   │
     │ Your longest run was 10km on February 1st!"                                  │
     │                                                                              │
     │ HABIT_LOGGING_SYSTEM_PROMPT Updates                                          │
     │                                                                              │
     │ 1. Add Unit Normalization Section (after line 80):                           │
     │ ## Unit Normalization (CRITICAL)                                             │
     │                                                                              │
     │ When extracting quantity and unit, ALWAYS normalize units to standard forms: │
     │                                                                              │
     │ **Distance:**                                                                │
     │ - "k", "kms", "kilometers", "kilometer" → "km"                               │
     │ - "mi", "mile", "miles" → "miles"                                            │
     │ - "m", "meter", "meters" → "meters"                                          │
     │                                                                              │
     │ **Time:**                                                                    │
     │ - "min", "mins", "minute", "minutes" → "minutes"                             │
     │ - "hr", "hrs", "hour", "hours" → "hours"                                     │
     │ - "sec", "secs", "second", "seconds" → "seconds"                             │
     │                                                                              │
     │ **Weight:**                                                                  │
     │ - "lb", "lbs", "pound", "pounds" → "pounds"                                  │
     │ - "kg", "kgs", "kilogram", "kilograms" → "kg"                                │
     │                                                                              │
     │ **Volume:**                                                                  │
     │ - "oz", "ounce", "ounces" → "oz"                                             │
     │ - "l", "liter", "liters", "litre", "litres" → "liters"                       │
     │ - "ml", "milliliter", "milliliters" → "ml"                                   │
     │                                                                              │
     │ **Count (no normalization needed):**                                         │
     │ - pages, reps, drinks, cigarettes, etc.                                      │
     │                                                                              │
     │ Examples:                                                                    │
     │ - "ran 5k" → unit: "km" (not "k")                                            │
     │ - "read for 30 mins" → unit: "minutes" (not "mins")                          │
     │ - "lifted 50 lbs" → unit: "pounds" (not "lbs")                               │
     │                                                                              │
     │ 2. Add Example with Unit Normalization (after Example 9):                    │
     │ ### Example 10: Unit normalization                                           │
     │ Existing habits:                                                             │
     │ - "running" (BUILD)                                                          │
     │ Input: "ran 5k 3 days ago"                                                   │
     │ Output:                                                                      │
     │ {                                                                            │
     │   "habitName": "running",                                                    │
     │   "completed": true,                                                         │
     │   "habitType": "BUILD",                                                      │
     │   "quantity": 5,                                                             │
     │   "unit": "km",  // ← normalized from "k"                                    │
     │   "timeOfDay": null,                                                         │
     │   "eventDate": "2026-01-31",                                                 │
     │   "notes": null                                                              │
     │ }                                                                            │
     │                                                                              │
     │ buildQueryPrompt() Function Update                                           │
     │                                                                              │
     │ Current (line 384-387):                                                      │
     │ export function buildQueryPrompt(userInput: string): string {                │
     │   const today = getTodayForPrompt()                                          │
     │   return `${HABIT_QUERY_SYSTEM_PROMPT}\n\nToday's date: ${today}\n\nUser     │
     │ question: "${userInput}"`                                                    │
     │ }                                                                            │
     │                                                                              │
     │ Updated:                                                                     │
     │ export function buildQueryPrompt(                                            │
     │   userInput: string,                                                         │
     │   existingHabits: Array<{ name: string; type: 'BUILD' | 'BREAK' }>           │
     │ ): string {                                                                  │
     │   const today = getTodayForPrompt()                                          │
     │                                                                              │
     │   let habitsContext = ''                                                     │
     │   if (existingHabits.length > 0) {                                           │
     │     habitsContext = '\n\nEXISTING HABITS (use these exact names when calling │
     │ tools):\n'                                                                   │
     │     habitsContext += existingHabits                                          │
     │       .map(h => `- "${h.name}" (${h.type})`)                                 │
     │       .join('\n')                                                            │
     │   } else {                                                                   │
     │     habitsContext = '\n\nEXISTING HABITS: None yet.'                         │
     │   }                                                                          │
     │                                                                              │
     │   return `${HABIT_QUERY_SYSTEM_PROMPT}\n\nToday's date:                      │
     │ ${today}${habitsContext}\n\nUser question: "${userInput}"`                   │
     │ }                                                                            │
     │                                                                              │
     │ Query Route Handler Update                                                   │
     │                                                                              │
     │ Current (lines 277-311):                                                     │
     │ app.get('/query', async (c) => {                                             │
     │   try {                                                                      │
     │     const prompt = c.req.query('prompt')                                     │
     │                                                                              │
     │     if (!prompt) {                                                           │
     │       return c.json({ error: 'Missing prompt parameter' }, 400)              │
     │     }                                                                        │
     │                                                                              │
     │     const query = buildQueryPrompt(prompt)                                   │
     │                                                                              │
     │     const result = streamText({                                              │
     │       model: openai('gpt-4o'),                                               │
     │       prompt: query,                                                         │
     │       // ...                                                                 │
     │     })                                                                       │
     │     // ...                                                                   │
     │   }                                                                          │
     │ })                                                                           │
     │                                                                              │
     │ Updated:                                                                     │
     │ app.get('/query', async (c) => {                                             │
     │   try {                                                                      │
     │     const prompt = c.req.query('prompt')                                     │
     │     const userId = 'default_user'                                            │
     │                                                                              │
     │     if (!prompt) {                                                           │
     │       return c.json({ error: 'Missing prompt parameter' }, 400)              │
     │     }                                                                        │
     │                                                                              │
     │     // Fetch existing habits for semantic matching (similar to /log endpoint)│
     │     const existingHabits = await prisma.habit.findMany({                     │
     │       where: { userId },                                                     │
     │       select: { name: true, type: true },                                    │
     │     })                                                                       │
     │                                                                              │
     │     const query = buildQueryPrompt(prompt, existingHabits)                   │
     │                                                                              │
     │     const result = streamText({                                              │
     │       model: openai('gpt-4o'),                                               │
     │       prompt: query,                                                         │
     │       // ...                                                                 │
     │     })                                                                       │
     │     // ...                                                                   │
     │   }                                                                          │
     │ })                                                                           │
     │                                                                              │
     │ Expected Outcomes                                                            │
     │                                                                              │
     │ After these changes:                                                         │
     │                                                                              │
     │ 1. "When did I last have a drink?" → Correctly maps to "drinking" habit and  │
     │ returns accurate date                                                        │
     │ 2. "What's the longest I've gone without drinking?" → Returns longest streak │
     │ calculation                                                                  │
     │ 3. "How many kilometers have I run?" → Returns sum of all quantities (e.g.,  │
     │ "42 km across 6 runs")                                                       │
     │ 4. "I ran 5k 3 days ago" → Always stores unit as "km" (not "k" or            │
     │ "kilometers")                                                                │
     │                                                                              │
     │ User Confirmation                                                            │
     │                                                                              │
     │ - Scope: These four issues are the main problems - no additional edge cases  │
     │ needed                                                                       │
     │ - Unit handling: Support both metric and imperial, normalize within each     │
     │ system (don't convert between systems)                                       │
     │                                                                              │
     │ Testing Plan                                                                 │
     │                                                                              │
     │ After implementation, test with:                                             │
     │ - Query variations: "have a drink" vs "drinking" vs "alcohol"                │
     │ - Aggregate queries: "how many km", "total pages", "total minutes"           │
     │ - Longest streak: "longest streak without drinking"                          │
     │ - Unit variants: "5k", "5km", "5 kilometers" all → "km"                      │
     │ - Mixed units: User can log "5km" one day and "3 miles" another (both        │
     │ accepted)
