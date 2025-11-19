// Test shim adapter: provide a VoteStore implementation that wraps a repository-style "votes" object
export default class VoteStore {
  constructor(votesRepo) {
    this.votes = votesRepo;
  }

  async create(input) {
    if (!this.votes || typeof this.votes.create !== 'function') {
      throw new Error('Underlying votes repo does not implement create');
    }
    return await this.votes.create(input);
  }

  async getById(id) {
    if (!this.votes || typeof this.votes.getById !== 'function') return null;
    return await this.votes.getById(id);
  }

  async getByBillId(billId) {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') return [];
    return await this.votes.getByBillId(billId);
  }

  async getByUserId(userId) {
    if (!this.votes || typeof this.votes.getByUserId !== 'function') return [];
    return await this.votes.getByUserId(userId);
  }

  async update(id, data) {
    if (!this.votes || typeof this.votes.update !== 'function') {
      throw new Error('Underlying votes repo does not implement update');
    }
    return await this.votes.update(id, data);
  }

  async delete(id) {
    if (!this.votes || typeof this.votes.delete !== 'function') {
      throw new Error('Underlying votes repo does not implement delete');
    }
    return await this.votes.delete(id);
  }

  async getAll(filter) {
    if (!this.votes || typeof this.votes.getAll !== 'function') return [];
    return await this.votes.getAll(filter || {});
  }

  async hasUserVotedOnBill(userId, billId) {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') return false;
    const rows = await this.votes.getByBillId(billId);
    return rows.some(r => r.userId === userId || r.user_id === userId);
  }

  async getVoteCounts(billId) {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') {
      return { aye: 0, nay: 0, abstain: 0, total: 0 };
    }
    const rows = await this.votes.getByBillId(billId);
    const aye = rows.filter(r => String(r.vote) === 'aye').length;
    const nay = rows.filter(r => String(r.vote) === 'nay').length;
    const abstain = rows.filter(r => String(r.vote) === 'abstain').length;
    return { aye, nay, abstain, total: rows.length };
  }

  validateVoteData(data) {
    if (!data || !data.billId || !data.userId) throw new Error('Missing required fields');
    const allowed = ['aye', 'nay', 'abstain', 'yes', 'no'];
    if (!data.vote || !allowed.includes(String(data.vote))) throw new Error('Invalid vote type');
  }
}
