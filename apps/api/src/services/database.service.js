/**
 * Database Service Layer
 * Abstraction layer for database operations
 * Currently uses in-memory storage, ready to migrate to Prisma/PostgreSQL
 */

import { randomUUID } from 'crypto';

// In-memory storage (temporary - replace with Prisma)
const storage = {
  chambers: new Map(),
  motions: new Map(),
  debates: new Map(),
  votes: new Map(),
  governments: new Map(),
  ministers: new Map(),
  executiveActions: new Map(),
  cabinetMeetings: new Map(),
  cases: new Map(),
  judges: new Map(),
  rulings: new Map(),
  reviews: new Map(),
  precedents: new Map(),
  pressReleases: new Map(),
  polls: new Map(),
  pollVotes: new Map(),
  coverage: new Map(),
  narratives: new Map(),
  approvalRatings: new Map(),
  elections: new Map(),
  campaigns: new Map(),
  constituencies: new Map(),
  candidates: new Map(),
  electionVotes: new Map(),
};

/**
 * Generic CRUD operations
 */
class DatabaseService {
  /**
   * Create a new record
   * @param {string} collection - Collection name
   * @param {Object} data - Data to create
   * @returns {Promise<Object>} Created record
   */
  async create(collection, data) {
    const id = data.id || randomUUID();
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    
    storage[collection].set(id, record);
    return record;
  }

  /**
   * Find a record by ID
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Found record or null
   */
  async findById(collection, id) {
    return storage[collection].get(id) || null;
  }

  /**
   * Find records matching criteria
   * @param {string} collection - Collection name
   * @param {Object} where - Filter criteria
   * @param {Object} options - Query options (skip, take, orderBy)
   * @returns {Promise<Array>} Matching records
   */
  async findMany(collection, where = {}, options = {}) {
    let records = Array.from(storage[collection].values());
    
    // Apply filters
    for (const [key, value] of Object.entries(where)) {
      records = records.filter(r => r[key] === value);
    }
    
    // Apply sorting
    if (options.orderBy) {
      const [field, direction] = Object.entries(options.orderBy)[0];
      records.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }
    
    // Apply pagination
    if (options.skip) {
      records = records.slice(options.skip);
    }
    if (options.take) {
      records = records.slice(0, options.take);
    }
    
    return records;
  }

  /**
   * Count records matching criteria
   * @param {string} collection - Collection name
   * @param {Object} where - Filter criteria
   * @returns {Promise<number>} Count of matching records
   */
  async count(collection, where = {}) {
    const records = await this.findMany(collection, where);
    return records.length;
  }

  /**
   * Update a record
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object|null>} Updated record or null
   */
  async update(collection, id, data) {
    const record = storage[collection].get(id);
    if (!record) return null;
    
    const updated = {
      ...record,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    storage[collection].set(id, updated);
    return updated;
  }

  /**
   * Delete a record
   * @param {string} collection - Collection name
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(collection, id) {
    return storage[collection].delete(id);
  }

  /**
   * Execute a transaction (simulated for in-memory storage)
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    // For in-memory storage, just execute the callback
    // In real implementation, this would use database transactions
    try {
      return await callback(this);
    } catch (error) {
      // In real implementation, rollback would happen here
      throw error;
    }
  }

  /**
   * Check if a record exists
   * @param {string} collection - Collection name
   * @param {Object} where - Filter criteria
   * @returns {Promise<boolean>} True if exists
   */
  async exists(collection, where) {
    const records = await this.findMany(collection, where);
    return records.length > 0;
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Export collection-specific helpers
export const ParliamentDB = {
  createChamber: (data) => db.create('chambers', data),
  getChamber: (id) => db.findById('chambers', id),
  listChambers: (where, options) => db.findMany('chambers', where, options),
  
  createMotion: (data) => db.create('motions', data),
  getMotion: (id) => db.findById('motions', id),
  listMotions: (where, options) => db.findMany('motions', where, options),
  updateMotion: (id, data) => db.update('motions', id, data),
  
  createDebate: (data) => db.create('debates', data),
  getDebate: (id) => db.findById('debates', id),
  
  createVote: (data) => db.create('votes', data),
  listVotes: (where) => db.findMany('votes', where),
  voteExists: (where) => db.exists('votes', where),
};

export const GovernmentDB = {
  createGovernment: (data) => db.create('governments', data),
  getGovernment: (id) => db.findById('governments', id),
  listGovernments: (where, options) => db.findMany('governments', where, options),
  updateGovernment: (id, data) => db.update('governments', id, data),
  
  createMinister: (data) => db.create('ministers', data),
  getMinister: (id) => db.findById('ministers', id),
  listMinisters: (where) => db.findMany('ministers', where),
  updateMinister: (id, data) => db.update('ministers', id, data),
  
  createExecutiveAction: (data) => db.create('executiveActions', data),
  getExecutiveAction: (id) => db.findById('executiveActions', id),
  listExecutiveActions: (where) => db.findMany('executiveActions', where),
  
  createCabinetMeeting: (data) => db.create('cabinetMeetings', data),
  getCabinetMeeting: (id) => db.findById('cabinetMeetings', id),
};

export const JudiciaryDB = {
  createCase: (data) => db.create('cases', data),
  getCase: (id) => db.findById('cases', id),
  listCases: (where, options) => db.findMany('cases', where, options),
  updateCase: (id, data) => db.update('cases', id, data),
  
  createJudge: (data) => db.create('judges', data),
  getJudge: (id) => db.findById('judges', id),
  listJudges: (where) => db.findMany('judges', where),
  updateJudge: (id, data) => db.update('judges', id, data),
  
  createRuling: (data) => db.create('rulings', data),
  getRuling: (id) => db.findById('rulings', id),
  listRulings: (where) => db.findMany('rulings', where),
  
  createReview: (data) => db.create('reviews', data),
  getReview: (id) => db.findById('reviews', id),
  listReviews: (where, options) => db.findMany('reviews', where, options),
  
  createPrecedent: (data) => db.create('precedents', data),
  listPrecedents: (where) => db.findMany('precedents', where),
};

export const MediaDB = {
  createPressRelease: (data) => db.create('pressReleases', data),
  getPressRelease: (id) => db.findById('pressReleases', id),
  listPressReleases: (where, options) => db.findMany('pressReleases', where, options),
  updatePressRelease: (id, data) => db.update('pressReleases', id, data),
  
  createPoll: (data) => db.create('polls', data),
  getPoll: (id) => db.findById('polls', id),
  listPolls: (where, options) => db.findMany('polls', where, options),
  updatePoll: (id, data) => db.update('polls', id, data),
  
  createPollVote: (data) => db.create('pollVotes', data),
  pollVoteExists: (where) => db.exists('pollVotes', where),
  
  createCoverage: (data) => db.create('coverage', data),
  listCoverage: (where, options) => db.findMany('coverage', where, options),
  
  createNarrative: (data) => db.create('narratives', data),
  getNarrative: (id) => db.findById('narratives', id),
  listNarratives: (where, options) => db.findMany('narratives', where, options),
  
  getApprovalRating: (key) => db.findById('approvalRatings', key),
  setApprovalRating: (key, data) => {
    storage.approvalRatings.set(key, data);
    return data;
  },
  listApprovalRatings: (where) => db.findMany('approvalRatings', where),
};

export const ElectionsDB = {
  createElection: (data) => db.create('elections', data),
  getElection: (id) => db.findById('elections', id),
  listElections: (where, options) => db.findMany('elections', where, options),
  updateElection: (id, data) => db.update('elections', id, data),
  
  createCampaign: (data) => db.create('campaigns', data),
  listCampaigns: (where) => db.findMany('campaigns', where),
  
  createConstituency: (data) => db.create('constituencies', data),
  getConstituency: (id) => db.findById('constituencies', id),
  listConstituencies: (where) => db.findMany('constituencies', where),
  updateConstituency: (id, data) => db.update('constituencies', id, data),
  
  createCandidate: (data) => db.create('candidates', data),
  getCandidate: (id) => db.findById('candidates', id),
  listCandidates: (where) => db.findMany('candidates', where),
  updateCandidate: (id, data) => db.update('candidates', id, data),
  
  createVote: (data) => db.create('electionVotes', data),
  voteExists: (where) => db.exists('electionVotes', where),
};
