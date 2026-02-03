import { Hono } from 'hono'
import { streamText as honoStreamText } from 'hono/streaming'
import { openai } from '@ai-sdk/openai'
import { generateText, Output, streamText, tool } from 'ai'
import { z } from 'zod'
import { prisma } from './lib/db'
import { favouriteColorAndFoodSystemPrompt, generateTagsForVideosSystemPrompt } from './prompts/favourite-color-and-food-prompt'
import habitRoutes from './routes/habits'

const app = new Hono()

const model = openai('gpt-4o-mini')

app.get('/', async (c) => {
  const prompt = c.req.query('prompt') ?? 'Make a night time playlist to help me sleep better'

  const result = streamText({
    model,
    system: favouriteColorAndFoodSystemPrompt,
    stopWhen: ({ steps }) => steps.length >= 2,
    tools: {
      getVideos: tool({
        description: "Get videos",
        inputSchema: z.object({}),
        outputSchema: z.object({
          videos: z.array(z.object({
            id: z.string(),
            title: z.string(),
            transcript: z.string(),
            duration: z.number(),
          })),
        }),
        execute: async () => {
          const rows = await prisma.video.findMany()
          return {
            videos: rows.map((v) => ({
              id: String(v.id),
              title: v.title,
              transcript: v.transcript,
              duration: v.duration,
            })),
          }
        },
      }),
    },
    prompt,
  })

  return honoStreamText(c, async (stream) => {
    for await (const chunk of result.textStream) {
      await stream.write(chunk)
    }
  })
})

// Mount habit tracking routes
app.route('/habits', habitRoutes)

export default app




