/**
 * Repository-style test shim for BillStore
 * Provides a mock adapter implementing the repository pattern expected by unit tests.
 *
 * NOTE: This is a temporary compatibility layer. Long-term goal is to standardize
 * on named exports from source TS files and update all tests to use the canonical API.
 */

class BillStore {
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

  async getAll(_filter = {}) {
    if (typeof this.db.getAll === 'function') {
      return await this.db.getAll(_filter);
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

  async getByStatus(status) {
    if (typeof this.db.getByStatus === 'function') {
      return await this.db.getByStatus(status);
    }
    throw new Error('getByStatus() not implemented on mock database');
  }

  validateBillData(data) {
    if (!data.title || !data.description) {
      throw new Error('Missing required fields');
    }
    const allowedStatuses = ['draft', 'proposed', 'active', 'passed', 'rejected'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      throw new Error('Invalid bill status');
    }
  }

  async addVote(billId, _userId, voteType) {
    const allowedVotes = ['yes', 'no', 'abstain'];
    if (!allowedVotes.includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    const bill = await this.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Initialize votes if not present
    if (!bill.votes) {
      bill.votes = { yes: 0, no: 0, abstain: 0 };
    }

    // Add the vote
    bill.votes[voteType] = (bill.votes[voteType] || 0) + 1;

    // Update the bill
    return await this.update(billId, { votes: bill.votes });
  }

  async getVoteResults(billId) {
    const bill = await this.getById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const votes = bill.votes || { yes: 0, no: 0, abstain: 0 };
    const totalVotes = (votes.yes || 0) + (votes.no || 0) + (votes.abstain || 0);

    return {
      totalVotes,
      yes: votes.yes || 0,
      no: votes.no || 0,
      abstain: votes.abstain || 0,
      passed: votes.yes > votes.no,
      percentYes: totalVotes > 0 ? (votes.yes / totalVotes) * 100 : 0,
      percentNo: totalVotes > 0 ? (votes.no / totalVotes) * 100 : 0,
      percentAbstain: totalVotes > 0 ? (votes.abstain / totalVotes) * 100 : 0,
    };
  }
}

export default BillStore;
