#!/usr/bin/env node
/**
 * Parliament Seed Data Generator
 *
 * Generates demo parliament data for development:
 * - Creates chambers (House of Commons, House of Lords)
 * - Creates sample motions in various states
 * - Sets up some motions for voting
 *
 * Usage: node scripts/dev/seed-parliament.mjs
 */

// No CommonJS require needed; keep ESM-only.

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function createChamber(data) {
  console.log(`Creating chamber: ${data.name}`);
  return makeRequest('/parliament/chambers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function createMotion(data) {
  console.log(`Creating motion: ${data.title}`);
  return makeRequest('/parliament/motions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function startVoting(motionId) {
  console.log(`Starting voting for motion: ${motionId}`);
  return makeRequest(`/parliament/motions/${motionId}/start-voting`, {
    method: 'POST',
  });
}

async function seedParliamentData() {
  console.log('🌐 Seeding Parliament data...\n');

  try {
    // Create chambers
    console.log('🏛️  Creating parliamentary chambers...');

    const commonsChamber = await createChamber({
      gameId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'commons',
      name: 'House of Commons',
      maxSeats: 650,
      quorumPercentage: 40,
    });

    const lordsChamber = await createChamber({
      gameId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'lords',
      name: 'House of Lords',
      maxSeats: 800,
      quorumPercentage: 30,
    });

    console.log('✅ Chambers created\n');

    // Create motions
    console.log('📜 Creating parliamentary motions...');

    const motions = [
      {
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        chamberId: commonsChamber.data.id,
        proposerId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'debate',
        title: 'Climate Change Emergency Bill',
        description:
          'A comprehensive bill to address the climate crisis through emissions reductions, renewable energy investment, and international cooperation.',
      },
      {
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        chamberId: commonsChamber.data.id,
        proposerId: '550e8400-e29b-41d4-a716-446655440002',
        type: 'vote',
        title: 'Healthcare Funding Amendment',
        description:
          'Amendment to increase NHS funding by £20 billion annually, funded through progressive taxation measures.',
      },
      {
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        chamberId: lordsChamber.data.id,
        proposerId: '550e8400-e29b-41d4-a716-446655440003',
        type: 'debate',
        title: 'Constitutional Reform Proposal',
        description:
          'Proposal to modernize the constitution, including electoral reform and devolution of powers to regional assemblies.',
      },
      {
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        chamberId: commonsChamber.data.id,
        proposerId: '550e8400-e29b-41d4-a716-446655440001',
        type: 'procedural',
        title: 'Emergency Session Request',
        description:
          'Request for an emergency parliamentary session to address the ongoing economic crisis.',
      },
      {
        gameId: '550e8400-e29b-41d4-a716-446655440000',
        chamberId: commonsChamber.data.id,
        proposerId: '550e8400-e29b-41d4-a716-446655440002',
        type: 'amendment',
        title: 'Budget Amendment - Education Funding',
        description:
          'Amendment to redirect £5 billion from defense spending to education and skills training programs.',
      },
    ];

    const createdMotions = [];
    for (const motion of motions) {
      const result = await createMotion(motion);
      createdMotions.push(result.data);
    }

    console.log('✅ Motions created\n');

    // Start voting on some motions
    console.log('🗳️  Starting voting on select motions...');

    // Start voting on the healthcare amendment
    const healthcareMotion = createdMotions.find(m => m.title.includes('Healthcare'));
    if (healthcareMotion) {
      await startVoting(healthcareMotion.id);
      console.log('✅ Started voting on Healthcare Funding Amendment');
    }

    // Start voting on the budget amendment
    const budgetMotion = createdMotions.find(m => m.title.includes('Budget'));
    if (budgetMotion) {
      await startVoting(budgetMotion.id);
      console.log('✅ Started voting on Budget Amendment');
    }

    console.log('\n✨ Parliament seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   Chambers: 2`);
    console.log(`   Motions: ${createdMotions.length}`);
    console.log(`   Voting Active: 2`);
    console.log('\n💡 You can now test the Parliament UI with real data.');
  } catch (error) {
    console.error('❌ Error seeding parliament data:', error.message);
    process.exit(1);
  }
}

// Run the seeder
seedParliamentData();
