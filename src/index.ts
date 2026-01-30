import { Hono } from 'hono'
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai'

const app = new Hono()

const model = openai('gpt-4o-mini')


app.get('/', async (c) => {
  const { textStream } = streamText({
    model,
    prompt: `What's my fave color?`,
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
})

export default app




