import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {


  console.log('Deleting existing data...')
  // await prisma.userPreference.deleteMany()
  // await prisma.video.deleteMany()
  // await prisma.tag.deleteMany()

  console.log('Seeding database...')

  const user = await prisma.userPreference.upsert({
    where: { userId: 'default_user' },
    update: {
      favoriteColor: 'red',
      favoriteFood: 'pizza',
    },
    create: {
      userId: 'default_user',
      favoriteColor: 'red',
      favoriteFood: 'pizza',
    },
  })

  const videos = [
    // Low Energy / Bedtime / Slowing Down Videos
    {
      id: 1,
      title: 'Night Time Routine',
      transcript: 'This video is great for people unable to sleep. Gentle movements and breathing exercises help calm your nervous system and prepare your body for rest. Perfect for winding down after a stressful day.',
      duration: 15,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 2,
      title: 'Gentle Evening Stretch',
      transcript: 'Perfect for anyone feeling tense after sitting all day. This routine releases tension in your neck, shoulders, and back through slow, mindful stretches. Ideal for evening relaxation before bed.',
      duration: 12,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 3,
      title: 'Meditation for Sleep',
      transcript: 'This video helps people with racing thoughts at bedtime. Guided meditation and progressive relaxation techniques quiet your mind and release physical tension. Watch this to drift off peacefully.',
      duration: 20,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 4,
      title: 'Calming Yoga Flow',
      transcript: 'Designed for those seeking stress relief and inner peace. Gentle yoga poses combined with deep breathing reduce anxiety and promote relaxation. Great for ending your day with calm energy.',
      duration: 18,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 5,
      title: 'Deep Breathing Exercise',
      transcript: 'This video is for anyone feeling overwhelmed or anxious. Simple breathing techniques activate your parasympathetic nervous system to create instant calm. Use this whenever you need to reset and relax.',
      duration: 8,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 6,
      title: 'Stress Relief Stretches',
      transcript: 'Perfect for people carrying tension in their body. These targeted stretches release stress stored in your muscles and joints. Ideal for anyone needing a gentle reset during or after a busy day.',
      duration: 14,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 7,
      title: 'Wind Down Pilates',
      transcript: 'Great for those wanting low-impact evening movement. Slow, controlled pilates exercises improve flexibility and body awareness while calming your mind. Perfect for gentle strengthening before rest.',
      duration: 16,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 8,
      title: 'Relaxing Body Scan',
      transcript: 'This video helps people who struggle to switch off mentally. A guided body scan brings awareness to each part of your body, releasing tension progressively. Excellent preparation for deep sleep.',
      duration: 10,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 9,
      title: 'Bedtime Mobility Flow',
      transcript: 'Designed for anyone feeling stiff before bed. Gentle mobility work loosens tight joints and muscles from the day. Watch this to prepare your body for comfortable, restorative sleep.',
      duration: 13,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    {
      id: 10,
      title: 'Evening Cool Down',
      transcript: 'Perfect for people who exercised earlier and need to fully recover. Slow movements and stretches help your body transition into rest mode. Great for reducing soreness and improving sleep quality.',
      duration: 11,
      tags: [
        { id: 1, name: 'sleep' },
        { id: 2, name: 'gentle' },
        { id: 3, name: 'relaxation' },
      ],
    },
    // High Energy / Active Videos
    {
      id: 11,
      title: 'Morning HIIT Workout',
      transcript: 'This video is for people who want to energize their day. High-intensity intervals boost your metabolism and wake up your body. Perfect for morning workouts that build strength and burn calories fast.',
      duration: 25,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 12,
      title: 'Full Body Cardio Blast',
      transcript: 'Designed for anyone looking to break a serious sweat. This intense cardio workout elevates your heart rate and works every muscle group. Great for burning calories and improving cardiovascular fitness.',
      duration: 30,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 13,
      title: 'Power Yoga Flow',
      transcript: 'Perfect for those wanting strength and flexibility combined. Dynamic poses linked with breath create heat and challenge your muscles. Ideal for building power while maintaining mindful movement.',
      duration: 22,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 14,
      title: 'Tabata Training',
      transcript: 'This video is for people short on time who want maximum results. Twenty seconds of all-out effort followed by brief rest intervals torch calories efficiently. Watch this for an intense four-minute workout.',
      duration: 20,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 15,
      title: 'Jump Rope Cardio',
      transcript: 'Great for anyone seeking a fun, effective cardio workout. Jump rope intervals improve coordination, endurance, and burn serious calories. Perfect for high-energy training that gets your heart pumping.',
      duration: 18,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 16,
      title: 'Core Strength Builder',
      transcript: 'Designed for people wanting a stronger, more stable midsection. Challenging core exercises target your abs, obliques, and back muscles. Ideal for building functional strength and improving posture.',
      duration: 15,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 17,
      title: 'Dynamic Warm Up',
      transcript: 'This video is for athletes preparing for intense training. Active movements increase blood flow, raise body temperature, and prime your nervous system. Watch this before workouts to prevent injury and perform better.',
      duration: 10,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 18,
      title: 'Explosive Plyometrics',
      transcript: 'Perfect for those looking to build power and athleticism. Jump training exercises develop explosive strength and fast-twitch muscle fibers. Great for athletes wanting to increase speed and vertical jump.',
      duration: 24,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 19,
      title: 'Circuit Training Session',
      transcript: 'Designed for people wanting total body conditioning. Move through strength and cardio stations with minimal rest for maximum efficiency. Ideal for building muscle while keeping your heart rate elevated.',
      duration: 28,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
    {
      id: 20,
      title: 'Metabolic Conditioning',
      transcript: 'This video is for serious fitness enthusiasts seeking a challenge. High-intensity metabolic work pushes your limits and improves work capacity. Perfect for burning fat while building mental toughness.',
      duration: 26,
      tags: [
        { id: 4, name: 'energy' },
        { id: 5, name: 'moderate' },
        { id: 6, name: 'strength' },
      ],
    },
  ]

  for (const videoData of videos) {
    await prisma.video.upsert({
      where: { id: videoData.id },
      update: {
        title: videoData.title,
        transcript: videoData.transcript,
        duration: videoData.duration,
        tags: {
          connectOrCreate: videoData.tags.map((tag) => ({
            where: { id: tag.id },
            create: { id: tag.id, name: tag.name },
          })),
        },
      },
      create: {
        id: videoData.id,
        title: videoData.title,
        transcript: videoData.transcript,
        duration: videoData.duration,
      },
    })
  }

  // delete all habits and habit logs
  await prisma.habit.deleteMany()
  await prisma.habitLog.deleteMany()

  console.log('Created user preference:', user)
  console.log(`Created ${videos.length} videos`)

  // Seed Habit Tracking Data
  console.log('Seeding habit tracking data...')

  // Create BUILD habits (positive habits to cultivate)
  // const runningHabit = await prisma.habit.upsert({
  //   where: { userId_name: { userId: 'default_user', name: 'running' } },
  //   update: {},
  //   create: {
  //     userId: 'default_user',
  //     name: 'running',
  //     type: 'BUILD',
  //   },
  // })

  // const readingHabit = await prisma.habit.upsert({
  //   where: { userId_name: { userId: 'default_user', name: 'reading before bed' } },
  //   update: {},
  //   create: {
  //     userId: 'default_user',
  //     name: 'reading before bed',
  //     type: 'BUILD',
  //   },
  // })

  // const meditatingHabit = await prisma.habit.upsert({
  //   where: { userId_name: { userId: 'default_user', name: 'meditating' } },
  //   update: {},
  //   create: {
  //     userId: 'default_user',
  //     name: 'meditating',
  //     type: 'BUILD',
  //   },
  // })

  // Create BREAK habits (negative habits to avoid)
  // const drinkingHabit = await prisma.habit.upsert({
  //   where: { userId_name: { userId: 'default_user', name: 'drinking' } },
  //   update: {},
  //   create: {
  //     userId: 'default_user',
  //     name: 'drinking',
  //     type: 'BREAK',
  //   },
  // })

  // const smokingHabit = await prisma.habit.upsert({
  //   where: { userId_name: { userId: 'default_user', name: 'smoking' } },
  //   update: {},
  //   create: {
  //     userId: 'default_user',
  //     name: 'smoking',
  //     type: 'BREAK',
  //   },
  // })

  // Create habit logs for running (7-day streak with quantities)
  // const today = new Date()
  // for (let i = 6; i >= 0; i--) {
  //   const eventDate = new Date(today)
  //   eventDate.setDate(eventDate.getDate() - i)
  //   eventDate.setHours(0, 0, 0, 0)

  //   await prisma.habitLog.create({
  //     data: {
  //       habitId: runningHabit.id,
  //       completed: true,
  //       eventDate: eventDate,
  //       quantity: 3 + Math.random() * 3, // 3-6 miles
  //       unit: 'miles',
  //       timeOfDay: i % 2 === 0 ? 'morning' : 'afternoon',
  //       notes: i === 0 ? 'Felt great today!' : null,
  //     },
  //   })
  // }

  // Create habit logs for reading (mixed completion, some missed days)
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: true,
  //     eventDate: new Date(new Date().setDate(today.getDate() - 10)),
  //     quantity: 30,
  //     unit: 'pages',
  //     timeOfDay: 'night',
  //   },
  // })
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: true,
  //     eventDate: new Date(new Date().setDate(today.getDate() - 9)),
  //     quantity: 25,
  //     unit: 'pages',
  //     timeOfDay: 'night',
  //   },
  // })
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: false,
  //     eventDate: new Date(new Date().setDate(today.getDate() - 8)),
  //     notes: 'Too tired, fell asleep immediately',
  //   },
  // })
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: true,
  //     eventDate: new Date(new Date().setDate(today.getDate() - 2)),
  //     quantity: 40,
  //     unit: 'pages',
  //     timeOfDay: 'night',
  //   },
  // })
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: true,
  //     eventDate: new Date(new Date().setDate(today.getDate() - 1)),
  //     quantity: 35,
  //     unit: 'pages',
  //     timeOfDay: 'night',
  //   },
  // })
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: readingHabit.id,
  //     completed: true,
  //     eventDate: today,
  //     quantity: 28,
  //     unit: 'pages',
  //     timeOfDay: 'night',
  //   },
  // })

  // // Create habit logs for meditating (recent 3-day streak)
  // for (let i = 2; i >= 0; i--) {
  //   const eventDate = new Date(today)
  //   eventDate.setDate(eventDate.getDate() - i)
  //   eventDate.setHours(0, 0, 0, 0)

  //   await prisma.habitLog.create({
  //     data: {
  //       habitId: meditatingHabit.id,
  //       completed: true,
  //       eventDate: eventDate,
  //       quantity: 10 + i * 5, // 10-20 minutes
  //       unit: 'minutes',
  //       timeOfDay: 'morning',
  //     },
  //   })
  // }

  // // Create habit logs for drinking (BREAK habit - successfully avoided for 19 days, last slip was 19 days ago)
  // await prisma.habitLog.create({
  //   data: {
  //     habitId: drinkingHabit.id,
  //     completed: false, // false = gave in to the habit
  //     eventDate: new Date(new Date().setDate(today.getDate() - 19)),
  //     quantity: 3,
  //     unit: 'drinks',
  //     timeOfDay: 'evening',
  //     notes: 'Had a few drinks at friend\'s party',
  //   },
  // })

  // // Successfully avoiding drinking for the past 18 days
  // for (let i = 18; i >= 0; i--) {
  //   const eventDate = new Date(today)
  //   eventDate.setDate(eventDate.getDate() - i)
  //   eventDate.setHours(0, 0, 0, 0)

  //   await prisma.habitLog.create({
  //     data: {
  //       habitId: drinkingHabit.id,
  //       completed: true, // true = successfully avoided
  //       eventDate: eventDate,
  //     },
  //   })
  // }

  // // Create habit logs for smoking (BREAK habit - longer streak of 30 days)
  // for (let i = 29; i >= 0; i--) {
  //   const eventDate = new Date(today)
  //   eventDate.setDate(eventDate.getDate() - i)
  //   eventDate.setHours(0, 0, 0, 0)

  //   await prisma.habitLog.create({
  //     data: {
  //       habitId: smokingHabit.id,
  //       completed: true, // true = successfully avoided
  //       eventDate: eventDate,
  //     },
  //   })
  // }

  // console.log('Created 5 habits with comprehensive log history:')
  // console.log(`  - ${runningHabit.name} (BUILD): 7-day streak with distance tracking`)
  // console.log(`  - ${readingHabit.name} (BUILD): mixed completion with page counts`)
  // console.log(`  - ${meditatingHabit.name} (BUILD): 3-day streak with duration`)
  // console.log(`  - ${drinkingHabit.name} (BREAK): 19-day avoidance streak`)
  // console.log(`  - ${smokingHabit.name} (BREAK): 30-day avoidance streak`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
