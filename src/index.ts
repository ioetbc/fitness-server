import { Hono } from 'hono'
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { prisma } from './lib/db'

const app = new Hono()

const model = openai('gpt-4o-mini')

const systemPrompt = `You are a helpful assistant that can only answer questions about the user's favorite color and favorite food.

If the user asks about their favorite color or favorite food, use the getUserPreference tool to retrieve the information, then respond with a complete sentence telling them their preference.

If the user asks anything else unrelated to their preferences, respond with exactly: "I can't help with that"

Always provide a text response after calling any tool.`

app.get('/', async (c) => {
  const prompt = c.req.query('prompt') ?? 'What is my favorite color the response must be atlest 300 characters long'
  const result = streamText({
    model,
    system: systemPrompt,
    stopWhen: ({ steps }) => steps.length >= 2,
    tools: {
      getUserPreference: tool({
        description: "Fetch the user's favorite color and favorite food",
        inputSchema: z.object({}),
        execute: async () => {
          const userPreference = await prisma.userPreference.findUnique({
            where: { userId: 'default_user' },
          })
          return userPreference
        },
      }),
    },
    prompt,
  })

  return result.toTextStreamResponse()
})

export default app




