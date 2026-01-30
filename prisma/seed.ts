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
    },
    {
      id: 2,
      title: 'Gentle Evening Stretch',
      transcript: 'Perfect for anyone feeling tense after sitting all day. This routine releases tension in your neck, shoulders, and back through slow, mindful stretches. Ideal for evening relaxation before bed.',
      duration: 12,
    },
    {
      id: 3,
      title: 'Meditation for Sleep',
      transcript: 'This video helps people with racing thoughts at bedtime. Guided meditation and progressive relaxation techniques quiet your mind and release physical tension. Watch this to drift off peacefully.',
      duration: 20,
    },
    {
      id: 4,
      title: 'Calming Yoga Flow',
      transcript: 'Designed for those seeking stress relief and inner peace. Gentle yoga poses combined with deep breathing reduce anxiety and promote relaxation. Great for ending your day with calm energy.',
      duration: 18,
    },
    {
      id: 5,
      title: 'Deep Breathing Exercise',
      transcript: 'This video is for anyone feeling overwhelmed or anxious. Simple breathing techniques activate your parasympathetic nervous system to create instant calm. Use this whenever you need to reset and relax.',
      duration: 8,
    },
    {
      id: 6,
      title: 'Stress Relief Stretches',
      transcript: 'Perfect for people carrying tension in their body. These targeted stretches release stress stored in your muscles and joints. Ideal for anyone needing a gentle reset during or after a busy day.',
      duration: 14,
    },
    {
      id: 7,
      title: 'Wind Down Pilates',
      transcript: 'Great for those wanting low-impact evening movement. Slow, controlled pilates exercises improve flexibility and body awareness while calming your mind. Perfect for gentle strengthening before rest.',
      duration: 16,
    },
    {
      id: 8,
      title: 'Relaxing Body Scan',
      transcript: 'This video helps people who struggle to switch off mentally. A guided body scan brings awareness to each part of your body, releasing tension progressively. Excellent preparation for deep sleep.',
      duration: 10,
    },
    {
      id: 9,
      title: 'Bedtime Mobility Flow',
      transcript: 'Designed for anyone feeling stiff before bed. Gentle mobility work loosens tight joints and muscles from the day. Watch this to prepare your body for comfortable, restorative sleep.',
      duration: 13,
    },
    {
      id: 10,
      title: 'Evening Cool Down',
      transcript: 'Perfect for people who exercised earlier and need to fully recover. Slow movements and stretches help your body transition into rest mode. Great for reducing soreness and improving sleep quality.',
      duration: 11,
    },
    // High Energy / Active Videos
    {
      id: 11,
      title: 'Morning HIIT Workout',
      transcript: 'This video is for people who want to energize their day. High-intensity intervals boost your metabolism and wake up your body. Perfect for morning workouts that build strength and burn calories fast.',
      duration: 25,
    },
    {
      id: 12,
      title: 'Full Body Cardio Blast',
      transcript: 'Designed for anyone looking to break a serious sweat. This intense cardio workout elevates your heart rate and works every muscle group. Great for burning calories and improving cardiovascular fitness.',
      duration: 30,
    },
    {
      id: 13,
      title: 'Power Yoga Flow',
      transcript: 'Perfect for those wanting strength and flexibility combined. Dynamic poses linked with breath create heat and challenge your muscles. Ideal for building power while maintaining mindful movement.',
      duration: 22,
    },
    {
      id: 14,
      title: 'Tabata Training',
      transcript: 'This video is for people short on time who want maximum results. Twenty seconds of all-out effort followed by brief rest intervals torch calories efficiently. Watch this for an intense four-minute workout.',
      duration: 20,
    },
    {
      id: 15,
      title: 'Jump Rope Cardio',
      transcript: 'Great for anyone seeking a fun, effective cardio workout. Jump rope intervals improve coordination, endurance, and burn serious calories. Perfect for high-energy training that gets your heart pumping.',
      duration: 18,
    },
    {
      id: 16,
      title: 'Core Strength Builder',
      transcript: 'Designed for people wanting a stronger, more stable midsection. Challenging core exercises target your abs, obliques, and back muscles. Ideal for building functional strength and improving posture.',
      duration: 15,
    },
    {
      id: 17,
      title: 'Dynamic Warm Up',
      transcript: 'This video is for athletes preparing for intense training. Active movements increase blood flow, raise body temperature, and prime your nervous system. Watch this before workouts to prevent injury and perform better.',
      duration: 10,
    },
    {
      id: 18,
      title: 'Explosive Plyometrics',
      transcript: 'Perfect for those looking to build power and athleticism. Jump training exercises develop explosive strength and fast-twitch muscle fibers. Great for athletes wanting to increase speed and vertical jump.',
      duration: 24,
    },
    {
      id: 19,
      title: 'Circuit Training Session',
      transcript: 'Designed for people wanting total body conditioning. Move through strength and cardio stations with minimal rest for maximum efficiency. Ideal for building muscle while keeping your heart rate elevated.',
      duration: 28,
    },
    {
      id: 20,
      title: 'Metabolic Conditioning',
      transcript: 'This video is for serious fitness enthusiasts seeking a challenge. High-intensity metabolic work pushes your limits and improves work capacity. Perfect for burning fat while building mental toughness.',
      duration: 26,
    },
  ]

  for (const videoData of videos) {
    await prisma.video.upsert({
      where: { id: videoData.id },
      update: {
        title: videoData.title,
        transcript: videoData.transcript,
        duration: videoData.duration,
      },
      create: {
        id: videoData.id,
        title: videoData.title,
        transcript: videoData.transcript,
        duration: videoData.duration,
      },
    })
  }

  console.log('Created user preference:', user)
  console.log(`Created ${videos.length} videos`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
