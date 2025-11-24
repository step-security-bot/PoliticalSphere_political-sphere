import { type CreatePartyInput, CreatePartySchema, type Party } from '@political-sphere/shared';

/**
 * @ignore
 */

import { getDatabase } from '../stores/index.js';

/**
 * PartyService provides operations to create and query political parties.
 *
 * The service validates input using shared schemas and maps persisted data
 * into domain models consumed by the API layer. Persistence calls are
 * delegated to the configured party store from `getDatabase()`.
 */
export class PartyService {
  // Lazy getter to avoid holding a stale DB connection across test lifecycle boundaries
  private get db() {
    return getDatabase();
  }

  async createParty(input: CreatePartyInput): Promise<Party> {
    // Validate input
    CreatePartySchema.parse(input);

    // Check if party name already exists
    const existingParty = await this.db.parties.getByName(input.name);
    if (existingParty) {
      throw new Error('Party name already exists');
    }

    const result = await this.db.parties.create(input);
    // Map store result (ISO date strings) to domain types (Date)
    return {
      id: result.id,
      name: result.name,
      color: result.color || '',
      description: result.description || undefined,
      createdAt: new Date(result.createdAt),
    };
  }

  async getPartyById(id: string): Promise<Party | null> {
    const party = await this.db.parties.getById(id);
    if (!party) return null;

    return {
      id: party.id as string,
      name: party.name as string,
      color: (party.color as string) || '',
      description: (party.description as string | undefined) ?? undefined,
      createdAt: new Date(party.createdAt as string),
    };
  }

  async getPartyByName(name: string): Promise<Party | null> {
    const party = await this.db.parties.getByName(name);
    if (!party) return null;

    return {
      id: party.id as string,
      name: party.name as string,
      color: (party.color as string) || '',
      description: (party.description as string | undefined) ?? undefined,
      createdAt: new Date(party.createdAt as string),
    };
  }

  async getAllParties(): Promise<Party[]> {
    const result = await this.db.parties.getAll();
    return result.parties.map((party: Record<string, unknown>) => ({
      id: party.id as string,
      name: party.name as string,
      color: (party.color as string) || '',
      description: (party.description as string | undefined) ?? undefined,
      createdAt: new Date(party.createdAt as string),
    }));
  }
}
