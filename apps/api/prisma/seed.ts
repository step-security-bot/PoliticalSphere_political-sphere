/**
 * Database Seed Script
 * Populates database with initial game data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create House of Commons chamber
  const commons = await prisma.chamber.upsert({
    where: { id: 'chamber-commons-1' },
    update: {},
    create: {
      id: 'chamber-commons-1',
      name: 'House of Commons',
      type: 'house',
      seats: 650,
    },
  });

  console.log('✅ Created House of Commons');

  // Create House of Lords chamber
  const _lords = await prisma.chamber.upsert({
    where: { id: 'chamber-lords-1' },
    update: {},
    create: {
      id: 'chamber-lords-1',
      name: 'House of Lords',
      type: 'senate',
      seats: 800,
    },
  });

  console.log('✅ Created House of Lords');

  // -----------------------------------------------------------------------
  // Election (required before creating constituencies due to FK constraint)
  // -----------------------------------------------------------------------
  const election = await prisma.election.upsert({
    where: { id: 'election-demo-1' },
    update: {},
    create: {
      id: 'election-demo-1',
      name: 'Demo General Election',
      type: 'general',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });
  console.log('✅ Created demo election');

  // Create demo constituencies for elections
  const constituencies = await Promise.all([
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'London Central',
        region: 'London',
        population: 75000,
      },
    }),
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'Manchester North',
        region: 'North West',
        population: 68000,
      },
    }),
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'Edinburgh South',
        region: 'Scotland',
        population: 72000,
      },
    }),
  ]);

  console.log(`✅ Created ${constituencies.length} constituencies`);

  // Create demo motion
  const _motion = await prisma.motion.create({
    data: {
      chamberId: commons.id,
      title: 'Climate Change Action Bill',
      description:
        'A motion to debate comprehensive climate change legislation including carbon reduction targets and renewable energy investment.',
      status: 'proposed',
    },
  });

  console.log('✅ Created demo motion');

  // Create demo press release
  const _pressRelease = await prisma.pressRelease.create({
    data: {
      title: 'Parliament Opens New Session',
      content:
        'The UK Parliament has opened its new session with a focus on economic recovery and climate action. Members from all parties gathered to discuss the legislative agenda for the coming term.',
      category: 'announcement',
      publishedAt: new Date(),
    },
  });

  console.log('✅ Created demo press release');

  // Create demo poll
  const _poll = await prisma.poll.create({
    data: {
      question: 'Which issue should Parliament prioritize?',
      options: ['Economy', 'Healthcare', 'Climate', 'Education'],
      status: 'active',
    },
  });

  console.log('✅ Created demo poll');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - 2 chambers created`);
  console.log(`   - 1 election created (id: ${election.id})`);
  console.log(`   - ${constituencies.length} constituencies created`);
  console.log(`   - 1 motion created`);
  console.log(`   - 1 press release created`);
  console.log(`   - 1 poll created`);
  console.log('');
  console.log('🚀 Ready to start the game!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
