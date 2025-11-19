/**
 * Database Service Layer
 * Abstraction layer for database operations using Prisma
 */

// Re-export Prisma-based database service
export {
  prismaDb as db,
  ParliamentDB,
  GovernmentDB,
  JudiciaryDB,
  MediaDB,
  ElectionsDB,
} from './prisma-database.service.js';
