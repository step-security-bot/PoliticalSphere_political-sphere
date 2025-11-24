/**
 * Repository-style test shim for PartyStore
 * Provides a mock adapter implementing the repository pattern expected by unit tests.
 *
 * NOTE: This is a temporary compatibility layer. Long-term goal is to standardize
 * on named exports from source TS files and update all tests to use the canonical API.
 */

import type { Party, CreatePartyInput, UpdatePartyInput } from '@political-sphere/shared';

interface MockPartyDatabase {
  create?: (data: CreatePartyInput) => Promise<Party>;
  getById?: (id: string) => Promise<Party | null>;
  getByName?: (name: string) => Promise<Party | null>;
  getAll?: (filter?: Record<string, unknown>) => Promise<Party[]>;
  update?: (id: string, data: UpdatePartyInput) => Promise<Party | null>;
  delete?: (id: string) => Promise<boolean>;
  getMembers?: (partyId: string) => Promise<unknown[]>;
  addMember?: (partyId: string, userId: string) => Promise<unknown>;
  removeMember?: (partyId: string, userId: string) => Promise<unknown>;
}

interface PartyFilter {
  [key: string]: unknown;
}

class PartyStore {
  private db: MockPartyDatabase;

  constructor(db: MockPartyDatabase) {
    this.db = db;
  }

  async create(data: CreatePartyInput): Promise<Party> {
    if (typeof this.db.create === 'function') {
      return await this.db.create(data);
    }
    throw new Error('create() not implemented on mock database');
  }

  async getById(id: string): Promise<Party | null> {
    if (typeof this.db.getById === 'function') {
      return await this.db.getById(id);
    }
    throw new Error('getById() not implemented on mock database');
  }

  async getByName(name: string): Promise<Party | null> {
    if (typeof this.db.getByName === 'function') {
      return await this.db.getByName(name);
    }
    throw new Error('getByName() not implemented on mock database');
  }

  async getAll(filter: PartyFilter = {}): Promise<Party[]> {
    if (typeof this.db.getAll === 'function') {
      return await this.db.getAll(filter);
    }
    throw new Error('getAll() not implemented on mock database');
  }

  async update(id: string, data: UpdatePartyInput): Promise<Party | null> {
    if (typeof this.db.update === 'function') {
      return await this.db.update(id, data);
    }
    throw new Error('update() not implemented on mock database');
  }

  async delete(id: string): Promise<boolean> {
    if (typeof this.db.delete === 'function') {
      return await this.db.delete(id);
    }
    throw new Error('delete() not implemented on mock database');
  }

  async getMembers(partyId: string): Promise<unknown[]> {
    if (typeof this.db.getMembers === 'function') {
      return await this.db.getMembers(partyId);
    }
    throw new Error('getMembers() not implemented on mock database');
  }

  async addMember(partyId: string, userId: string): Promise<unknown> {
    if (typeof this.db.addMember === 'function') {
      return await this.db.addMember(partyId, userId);
    }
    throw new Error('addMember() not implemented on mock database');
  }

  async removeMember(partyId: string, userId: string): Promise<unknown> {
    if (typeof this.db.removeMember === 'function') {
      return await this.db.removeMember(partyId, userId);
    }
    throw new Error('removeMember() not implemented on mock database');
  }

  validatePartyData(data: CreatePartyInput): void {
    if (!data.name || !data.description) {
      throw new Error('Missing required fields');
    }
    if (data.name && data.name.length < 2) {
      throw new Error('Party name must be at least 2 characters');
    }
  }
}

/**
 * Default export: `PartyStore` repository-style test shim.
 *
 * Provides a thin adapter around a mock `db` implementing party-related
 * operations. Intended for tests to interact with a predictable party API
 * without requiring a full database. Methods forward to the underlying mock
 * implementation and throw descriptive errors when operations are missing.
 */
export default PartyStore;
