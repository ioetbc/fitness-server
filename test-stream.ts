import { openai } from '@ai-sdk/openai'
import { Output, streamText, tool } from 'ai'
import { z } from 'zod'
import { prisma } from './src/lib/db'
import { generateTagsForVideosSystemPrompt } from './src/prompts/favourite-color-and-food-prompt'

const model = openai('gpt-4o-mini')

async function test() {
  console.log('Starting stream test...')

  const result = streamText({
    model,
    system: generateTagsForVideosSystemPrompt,
    prompt: 'Get all videos and generate appropriate tags for each one based on their transcripts',
    stopWhen: ({ steps }) => steps.length >= 2,
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

  console.log('Collecting stream...')
  let fullText = ''
  for await (const chunk of result.textStream) {
    fullText += chunk
    process.stdout.write(chunk)
  }

  console.log('\n\nFull text length:', fullText.length)
  console.log('Full text:', fullText)
}

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
