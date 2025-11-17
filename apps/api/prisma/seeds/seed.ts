// Prisma seed script for Political Sphere
// Populates the database with initial development data
// NOTE: Temporarily disabled due to missing Prisma schema models
// TODO: Re-enable after Prisma schema migration is complete

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed script temporarily disabled - schema migration in progress');
  // Clear existing data (development only)
  // if (process.env.NODE_ENV === 'development') {
  //   await prisma.vote.deleteMany();
  //   await prisma.user.deleteMany();
  //   await prisma.party.deleteMany();
  //   await prisma.proposal.deleteMany();
  //   await prisma.newsArticle.deleteMany();
  //   console.log('✓ Cleared existing data');
  // }

  // Seed political parties
  // const parties = await Promise.all([
  //   prisma.party.create({
  //     data: {
  //       name: 'Progressive Alliance',
  //       description:
  //         'A center-left political party focused on social justice and environmental sustainability.',
  //       ideology: 'social-democracy',
  //     },
  //   }),
  //   prisma.party.create({
  //     data: {
  //       name: 'Conservative Union',
  //       description:
  //         'A center-right political party emphasizing traditional values and fiscal responsibility.',
  //       ideology: 'conservatism',
  //     },
  //   }),
  //   prisma.party.create({
  //     data: {
  //       name: 'Green Future',
  //       description: 'An environmental party prioritizing climate action and ecological policies.',
  //       ideology: 'green-politics',
  //     },
  //   }),
  // ]);
  // console.log(`✓ Created ${parties.length} political parties`);

  // Seed users - DISABLED
  // const users = await Promise.all([
  //   prisma.user.create({
  //     data: {
  //       email: 'admin@political-sphere.com',
  //       username: 'admin',
  //       password: '$2b$10$placeholder.hash.for.development', // Replace with actual hash
  //       role: 'ADMIN',
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'moderator@political-sphere.com',
  //       username: 'moderator',
  //       password: '$2b$10$placeholder.hash.for.development',
  //       role: 'MODERATOR',
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'user1@political-sphere.com',
  //       username: 'citizen_one',
  //       password: '$2b$10$placeholder.hash.for.development',
  //       role: 'USER',
  //       partyId: parties[0].id,
  //     },
  //   }),
  // ]);
  // console.log(`✓ Created ${users.length} users`);

  // Seed proposals - DISABLED
  // const proposals = await Promise.all([
  //   prisma.proposal.create({
  //     data: {
  //       title: 'Climate Action Bill 2025',
  //       description:
  //         'Proposal to reduce carbon emissions by 50% by 2030 through renewable energy investments.',
  //       status: 'ACTIVE',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  //     },
  //   }),
  //   prisma.proposal.create({
  //     data: {
  //       title: 'Universal Basic Income Pilot',
  //       description: 'Trial program providing £1000/month to 10,000 citizens for 2 years.',
  //       status: 'ACTIVE',
  //       expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  //     },
  //   }),
  // ]);
  // console.log(`✓ Created ${proposals.length} proposals`);

  // Seed news articles - DISABLED
  // const articles = await Promise.all([
  //   prisma.newsArticle.create({
  //     data: {
  //       title: 'Political Sphere Platform Launches',
  //       excerpt: 'New digital democracy platform enables citizens to participate in governance.',
  //       content:
  //         'The Political Sphere platform officially launched today, providing a new way for citizens to engage with democratic processes...',
  //       category: 'platform',
  //       status: 'PUBLISHED',
  //     },
  //   }),
  // ]);
  // console.log(`✓ Created ${articles.length} news articles`);

  console.log('✅ Seed script disabled - awaiting schema migration');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
