import { Hono } from 'hono'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'
import { prisma } from './lib/db'

const app = new Hono()

const model = openai('gpt-4o-mini')

const systemPrompt = `You are a helpful assistant that can only answer questions about the user's favorite color and favorite food.

If the user asks about their favorite color or favorite food, use the getUserPreference tool to retrieve the information.

If the user asks anything else unrelated to their preferences, respond with exactly: "I can't help with that"`

app.get('/', async (c) => {
  return c.json({
    status: 'ok',
    message: 'Fitness server is running'
  })
})

app.post('/chat', async (c) => {
  try {
    const body = await c.req.json()
    const message = body.message

    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: message,
      tools: {
        getUserPreference: {
          description: 'Get the user\'s favorite color or food preference',
          parameters: z.object({
            preferenceType: z.enum(['color', 'food']).describe('The type of preference to retrieve'),
          }),
          execute: async ({ preferenceType }) => {
            try {
              const userPreference = await prisma.userPreference.findUnique({
                where: { userId: 'default_user' },
              })

              if (!userPreference) {
                return { error: 'User preferences not found' }
              }

              if (preferenceType === 'color') {
                return { preference: userPreference.favoriteColor }
              } else {
                return { preference: userPreference.favoriteFood }
              }
            } catch (error) {
              console.error('Database error:', error)
              return { error: 'Failed to retrieve preference' }
            }
          },
        },
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Error in /chat endpoint:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app




