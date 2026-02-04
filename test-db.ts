import { prisma } from './src/lib/db'

async function main() {
  const videos = await prisma.video.findMany({
    take: 2
  })
  console.log('Video count:', videos.length)
  console.log('Sample videos:', JSON.stringify(videos, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
