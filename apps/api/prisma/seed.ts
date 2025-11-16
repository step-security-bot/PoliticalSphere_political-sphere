/**
 * Database Seed Script
 * Populates database with initial game data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Note: Game model not yet implemented in schema
  // Using a placeholder gameId for related entities
  const gameId = 'demo-game-1';
  console.log('📝 Using game ID:', gameId);

  // Create House of Commons chamber
  const commons = await prisma.chamber.upsert({
    where: { id: 'chamber-commons-1' },
    update: {},
    create: {
      id: 'chamber-commons-1',
      gameId,
      type: 'commons',
      name: 'House of Commons',
      maxSeats: 650,
      quorumPercentage: 40,
      status: 'active',
    },
  });

  console.log('✅ Created House of Commons');

  // Create House of Lords chamber
  const _lords = await prisma.chamber.upsert({
    where: { id: 'chamber-lords-1' },
    update: {},
    create: {
      id: 'chamber-lords-1',
      gameId,
      type: 'lords',
      name: 'House of Lords',
      maxSeats: 800,
      quorumPercentage: 30,
      status: 'active',
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
      gameId,
      name: 'Demo General Election',
      electionType: 'general',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days window
      description: 'Demonstration election seeded for local development.',
      status: 'scheduled',
    },
  });
  console.log('✅ Created demo election');

  // Note: Party model not yet implemented in schema
  // Commenting out party creation
  // Placeholder until Party model exists
  const parties: unknown[] = [];
  /*
  const parties = await Promise.all([
    prisma.party.upsert({
      where: { id: 'party-labour' },
      update: {},
      create: {
        id: 'party-labour',
        gameId: game.id,
        name: 'Labour Party',
        abbreviation: 'LAB',
        color: '#E4003B',
        ideology: 'Centre-left',
        founded: new Date('1900-02-27'),
        leader: null,
        seats: 0,
        status: 'active',
      },
    }),
    prisma.party.upsert({
      where: { id: 'party-conservative' },
      update: {},
      create: {
        id: 'party-conservative',
        gameId: game.id,
        name: 'Conservative Party',
        abbreviation: 'CON',
        color: '#0087DC',
        ideology: 'Centre-right',
        founded: new Date('1834-01-01'),
        leader: null,
        seats: 0,
        status: 'active',
      },
    }),
    prisma.party.upsert({
      where: { id: 'party-libdem' },
      update: {},
      create: {
        id: 'party-libdem',
        gameId: game.id,
        name: 'Liberal Democrats',
        abbreviation: 'LD',
        color: '#FAA61A',
        ideology: 'Centrist',
        founded: new Date('1988-03-03'),
        leader: null,
        seats: 0,
        status: 'active',
      },
    }),
    prisma.party.upsert({
      where: { id: 'party-snp' },
      update: {},
      create: {
        id: 'party-snp',
        gameId: game.id,
        name: 'Scottish National Party',
        abbreviation: 'SNP',
        color: '#FDF38E',
        ideology: 'Centre-left',
        founded: new Date('1934-04-07'),
        leader: null,
        seats: 0,
        status: 'active',
      },
    }),
    prisma.party.upsert({
      where: { id: 'party-green' },
      update: {},
      create: {
        id: 'party-green',
        gameId: game.id,
        name: 'Green Party',
        abbreviation: 'GRN',
        color: '#6AB023',
        ideology: 'Left-wing',
        founded: new Date('1990-09-16'),
        leader: null,
        seats: 0,
        status: 'active',
      },
    }),
  ]);
  */

  console.log(`📝 Skipped party creation (model not implemented): ${parties.length} parties`);

  // Create demo constituencies for elections
  const constituencies = await Promise.all([
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'London Central',
        population: 75000,
        registeredVoters: 55000,
        region: 'London',
      },
    }),
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'Manchester North',
        population: 68000,
        registeredVoters: 48000,
        region: 'North West',
      },
    }),
    prisma.constituency.create({
      data: {
        electionId: election.id,
        name: 'Edinburgh South',
        population: 72000,
        registeredVoters: 52000,
        region: 'Scotland',
      },
    }),
  ]);

  console.log(`✅ Created ${constituencies.length} constituencies`);

  // Create demo motion
  const _motion = await prisma.motion.create({
    data: {
      gameId,
      chamberId: commons.id,
      proposerId: 'system',
      type: 'debate',
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
      gameId,
      authorId: 'system',
      authorType: 'government',
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
      gameId,
      creatorId: 'system',
      question: 'Which issue should Parliament prioritize?',
      options: ['Economy', 'Healthcare', 'Climate', 'Education'],
      pollType: 'issue',
      duration: 7 * 24 * 60 * 60, // 7 days in seconds
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active',
    },
  });

  console.log('✅ Created demo poll');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Game ID: ${gameId} (model not implemented)`);
  console.log(`   - 2 chambers created`);
  console.log(`   - 1 election created (id: ${election.id})`);
  console.log(`   - ${parties.length} parties created (model not implemented)`);
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
