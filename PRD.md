# Product Requirements Document: User Preferences Query System

## Overview
Add database-backed user preferences querying capability to the Hono app, enabling an OpenAI model to answer questions about user preferences (favorite color and food) through function calling.

## Objectives
- Store user preferences in a database (favorite color and favorite food)
- Enable OpenAI model to query the database for relevant questions
- Restrict model responses to only preference-related queries
- Reject unrelated questions with a specific message

## Current State
- **Application**: Simple Hono app with OpenAI streaming
- **Location**: `/Users/ioetbc/Free/fitness-sever/src/index.ts`
- **Technology Stack**: Hono + Vercel AI SDK + Bun runtime
- **Current Issue**: Writes to stdout instead of returning HTTP response
- **Database**: None (purely stateless)

## Requirements

### Functional Requirements

#### FR1: Database Setup
- Use Prisma ORM with SQLite database
- Single user implementation (no authentication required)
- Store two preference types:
  - Favorite color
  - Favorite food

#### FR2: Database Schema
```
UserPreference
- id: Int (auto-increment, primary key)
- userId: String (unique, default: "default_user")
- favoriteColor: String (optional)
- favoriteFood: String (optional)
- createdAt: DateTime
- updatedAt: DateTime
```

#### FR3: Default Data
- Default user preferences:
  - Favorite color: "blue"
  - Favorite food: "pizza"

#### FR4: OpenAI Function Calling
- Implement tool/function calling capability
- Tool name: `getUserPreference`
- Tool parameters:
  - `preferenceType`: enum of "color" or "food"
- Tool executes database query via Prisma
- Returns preference value to model

#### FR5: Query Handling
**Supported queries**:
- Questions about favorite color
  - Example: "What is my favorite color?"
  - Response: "Your favorite color is blue"
- Questions about favorite food
  - Example: "What is my favorite food?"
  - Response: "Your favorite food is pizza"

**Unsupported queries**:
- Any question unrelated to preferences
  - Example: "What is the weather today?"
  - Response: "I can't help with that"

#### FR6: API Endpoints
- `POST /chat`: Main chat endpoint
  - Accepts JSON body: `{ "message": "user question" }`
  - Returns streaming response via Server-Sent Events (SSE)
- `GET /`: Health check endpoint
  - Returns: `{ "status": "ok", "message": "Fitness server is running" }`

### Technical Requirements

#### TR1: Dependencies
New dependencies to add:
- `@prisma/client`: Runtime client for database operations
- `prisma`: CLI tool for migrations (dev dependency)
- `zod`: Schema validation for tool parameters

#### TR2: Project Structure
```
/Users/ioetbc/Free/fitness-sever/
├── src/
│   ├── index.ts (MODIFIED)
│   └── lib/
│       └── db.ts (NEW)
├── prisma/
│   ├── schema.prisma (NEW)
│   ├── seed.ts (NEW)
│   ├── dev.db (NEW, gitignored)
│   └── migrations/ (NEW)
├── package.json (MODIFIED)
└── .gitignore (MODIFIED)
```

#### TR3: Prisma Client Pattern
- Implement singleton pattern to prevent multiple instances
- Critical for Bun's hot reload functionality
- Prevents connection exhaustion

#### TR4: Streaming Response
- Fix current stdout implementation
- Use `toDataStreamResponse()` from AI SDK
- Return proper HTTP response with SSE headers:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

#### TR5: Error Handling
- Database query failures return error object to model
- Catch and log errors in endpoint handler
- Return appropriate HTTP status codes (400, 500)
- Handle missing preferences gracefully

### Non-Functional Requirements

#### NFR1: Performance
- Database queries should complete within 100ms
- Streaming response should start immediately
- No blocking operations during streaming

#### NFR2: Maintainability
- Clear separation of concerns (database logic in separate file)
- Type-safe database queries via Prisma
- Comprehensive error logging

#### NFR3: Development Experience
- Hot reload should work without connection issues
- Database migrations should be version controlled
- Seed script for quick setup

## Implementation Flow

### User Interaction Flow
```
User → POST /chat with message
  ↓
Hono receives request
  ↓
Extract message from JSON body
  ↓
Call streamText with tools and system prompt
  ↓
OpenAI analyzes message
  ↓
  ├─→ Preference question detected
  │     ↓
  │   Call getUserPreference tool
  │     ↓
  │   Execute Prisma query
  │     ↓
  │   Return data to model
  │     ↓
  │   Generate response with data
  │
  ├─→ Unrelated question detected
  │     ↓
  │   Generate "I can't help with that"
  │
  ↓
Stream response to user via HTTP SSE
```

### Function Calling Flow
1. Model receives user message
2. System prompt guides behavior
3. Model decides to call `getUserPreference` tool
4. AI SDK pauses streaming
5. Tool's `execute` function runs:
   - Query Prisma: `findUnique({ where: { userId: 'default_user' } })`
   - Extract requested preference (color or food)
   - Return value
6. Model receives tool result
7. Model generates natural language response
8. AI SDK resumes streaming with final response

## System Prompt Strategy

```
You are a helpful assistant that can only answer questions about the user's
favorite color and favorite food.

If the user asks about their favorite color or favorite food, use the
getUserPreference tool to retrieve the information.

If the user asks anything else unrelated to their preferences, respond with
exactly: "I can't help with that"
```

## Testing Scenarios

### Test Case 1: Favorite Color Query
- **Input**: `POST /chat` with `{ "message": "What is my favorite color?" }`
- **Expected**: Stream response "Your favorite color is blue"
- **Validation**: Database is queried, color value returned

### Test Case 2: Favorite Food Query
- **Input**: `POST /chat` with `{ "message": "What is my favorite food?" }`
- **Expected**: Stream response "Your favorite food is pizza"
- **Validation**: Database is queried, food value returned

### Test Case 3: Unrelated Query
- **Input**: `POST /chat` with `{ "message": "What is the weather today?" }`
- **Expected**: Stream response "I can't help with that"
- **Validation**: No database query, model rejects based on system prompt

### Test Case 4: Health Check
- **Input**: `GET /`
- **Expected**: `200 OK` with `{ "status": "ok", "message": "Fitness server is running" }`
- **Validation**: Endpoint responds without errors

### Test Case 5: Invalid Request
- **Input**: `POST /chat` with empty body
- **Expected**: `400 Bad Request` with error message
- **Validation**: Proper error handling

## Commands Reference

### Setup Commands
```bash
# Install dependencies
bun add @prisma/client zod
bun add -D prisma

# Initialize Prisma
bunx prisma init --datasource-provider sqlite

# Run migration
bunx prisma migrate dev --name init

# Seed database
bun run db:seed
```

### Development Commands
```bash
# Start dev server
bun run dev

# Open Prisma Studio (database GUI)
bunx prisma studio

# Generate Prisma Client
bunx prisma generate

# Reset database
bunx prisma migrate reset
```

### Testing Commands
```bash
# Health check
curl http://localhost:3000/

# Test favorite color
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my favorite color?"}'

# Test favorite food
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my favorite food?"}'

# Test unrelated question
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather today?"}'
```

## Future Enhancements

### Phase 2 Considerations
- **Multiple users**: Add authentication and user identification
- **More preferences**: Add favorite movie, song, sport, etc.
- **Update preferences**: Tool to set/update preferences via conversation
- **Preference history**: Track changes over time
- **Production database**: Migrate from SQLite to PostgreSQL

### Extensibility
The architecture supports easy addition of new tools:
- Create new tool definitions with Zod schemas
- Add tool to `tools` object in `streamText`
- Implement execute function with database logic
- Update system prompt to guide model behavior

## Success Criteria
- Database successfully stores and retrieves user preferences
- OpenAI model correctly queries database for relevant questions
- Model rejects unrelated questions with specified message
- Streaming response works properly via HTTP (no stdout issues)
- All test cases pass
- Hot reload works without connection issues

## Dependencies
- Hono: ^4.11.7
- ai (Vercel AI SDK): ^6.0.62
- @ai-sdk/openai: ^3.0.23
- @prisma/client: Latest
- zod: Latest
- prisma: Latest (dev)

## Environment Variables
```
OPENAI_API_KEY=<your-key>
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

## Security Considerations
- `.env` file must be gitignored
- Database file should be gitignored
- OpenAI API key should never be committed
- Input validation via Zod schemas
- Error messages should not expose internal details

## Deployment Notes
For production deployment:
- Use PostgreSQL instead of SQLite
- Enable connection pooling
- Set proper environment variables
- Use managed database service
- Implement rate limiting
- Add authentication for multiple users
