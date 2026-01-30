import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'
import { prisma } from './lib/db'

const app = new Hono()

const model = openai('gpt-4o-mini')

const systemPrompt = `You are a helpful assistant that can only answer questions about the user's favorite color and favorite food.

If the user asks about their favorite color or favorite food, use the getUserPreference tool to retrieve the information, then respond with a complete sentence telling them their preference.

If the user asks anything else unrelated to their preferences, respond with exactly: "I can't help with that"

Always provide a text response after calling any tool.`

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

    console.log('Received message:', message)

    // Check if asking about preferences
    const lowerMessage = message.toLowerCase()
    const askingAboutColor = lowerMessage.includes('color')
    const askingAboutFood = lowerMessage.includes('food')

    if (askingAboutColor || askingAboutFood) {
      return stream(c, async (responseStream) => {
        const preferenceType = askingAboutColor ? 'color' : 'food'

        const userPreference = await prisma.userPreference.findUnique({
          where: { userId: 'default_user' },
        })

        if (!userPreference) {
          await responseStream.write('I could not find your preferences.')
          return
        }

        const value = preferenceType === 'color' ? userPreference.favoriteColor : userPreference.favoriteFood
        const response = `Your favorite ${preferenceType} is ${value}.`

        // Stream the response character by character for demonstration
        for (const char of response) {
          console.log('Char:', char)
          await responseStream.write(char)
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      })
    } else {
      return stream(c, async (responseStream) => {
        const response = "I can't help with that"
        for (const char of response) {
          console.log('Char:', char)
          await responseStream.write(char)
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      })
    }
  } catch (error) {
    console.error('Error in /chat endpoint:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app




