/**
 * Repository-style test shim for PartyStore
 * Provides a mock adapter implementing the repository pattern expected by unit tests.
 *
 * NOTE: This is a temporary compatibility layer. Long-term goal is to standardize
 * on named exports from source TS files and update all tests to use the canonical API.
 */

class PartyStore {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    if (typeof this.db.create === 'function') {
      return await this.db.create(data);
    }
    throw new Error('create() not implemented on mock database');
  }

  async getById(id) {
    if (typeof this.db.getById === 'function') {
      return await this.db.getById(id);
    }
    throw new Error('getById() not implemented on mock database');
  }

  async getByName(name) {
    if (typeof this.db.getByName === 'function') {
      return await this.db.getByName(name);
    }
    throw new Error('getByName() not implemented on mock database');
  }

  async getAll(filter = {}) {
    if (typeof this.db.getAll === 'function') {
      return await this.db.getAll(filter);
    }
    throw new Error('getAll() not implemented on mock database');
  }

  async update(id, data) {
    if (typeof this.db.update === 'function') {
      return await this.db.update(id, data);
    }
    throw new Error('update() not implemented on mock database');
  }

  async delete(id) {
    if (typeof this.db.delete === 'function') {
      return await this.db.delete(id);
    }
    throw new Error('delete() not implemented on mock database');
  }

  async getMembers(partyId) {
    if (typeof this.db.getMembers === 'function') {
      return await this.db.getMembers(partyId);
    }
    throw new Error('getMembers() not implemented on mock database');
  }

  async addMember(partyId, userId) {
    if (typeof this.db.addMember === 'function') {
      return await this.db.addMember(partyId, userId);
    }
    throw new Error('addMember() not implemented on mock database');
  }

  async removeMember(partyId, userId) {
    if (typeof this.db.removeMember === 'function') {
      return await this.db.removeMember(partyId, userId);
    }
    throw new Error('removeMember() not implemented on mock database');
  }

  validatePartyData(data) {
    if (!data.name || !data.description) {
      throw new Error('Missing required fields');
    }
    if (data.name && data.name.length < 2) {
      throw new Error('Party name must be at least 2 characters');
    }
  }
}

export default PartyStore;
