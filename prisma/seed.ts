import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const user = await prisma.userPreference.upsert({
    where: { userId: 'default_user' },
    update: {},
    create: {
      userId: 'default_user',
      favoriteColor: 'blue',
      favoriteFood: 'pizza',
    },
  })

  console.log('Created user preference:', user)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
