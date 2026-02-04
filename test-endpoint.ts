import { openai } from '@ai-sdk/openai'
import { generateText, Output, tool } from 'ai'
import { z } from 'zod'
import { prisma } from './src/lib/db'
import { generateTagsForVideosSystemPrompt } from './src/prompts/favourite-color-and-food-prompt'

const model = openai('gpt-4o-mini')

async function test() {
  console.log('Starting test...')

  const result = await generateText({
    model,
    system: generateTagsForVideosSystemPrompt,
    prompt: 'Get all videos and generate appropriate tags for each one based on their transcripts',
    maxSteps: 5,
    output: Output.object({
      schema: z.object({
        videos: z.array(z.object({
          id: z.string(),
          title: z.string(),
          transcript: z.string(),
          duration: z.number(),
          tags: z.array(z.object({
            name: z.string(),
          })),
        })),
      }),
    }),
    tools: {
      getVideos: tool({
        description: "Get all videos from the database with their transcripts",
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
          console.log('getVideos tool called!')
          const videos = await prisma.video.findMany({})
          console.log('Found videos:', videos.length)

          return {
            videos: videos.map((v) => ({
              id: String(v.id),
              title: v.title,
              transcript: v.transcript,
              duration: v.duration,
            })),
          }
        },
      }),
    },
  })

  console.log('Steps:', result.steps?.length)
  console.log('Result object:', JSON.stringify(result.object, null, 2))
  console.log('Full result:', JSON.stringify(result, null, 2))
}

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
