// Test shim adapter: provide a VoteStore implementation that wraps a repository-style "votes" object
/**
 * Test shim implementing a repository-like `VoteStore` used by unit tests.
 *
 * The class delegates to an underlying `votes` repository object which is
 * expected to implement CRUD-like methods (create, getById, getByBillId,
 * getByUserId, update, delete, getAll). This adapter provides a stable API
 * for tests and defensive checks with helpful errors when the mock is missing
 * expected methods.
 *
 * NOTE: This is a lightweight test shim and does not enforce runtime typing.
 */
export default class VoteStore {
  private votes: any;

  constructor(votesRepo: any) {
    this.votes = votesRepo;
  }

  async create(input: any): Promise<any> {
    if (!this.votes || typeof this.votes.create !== 'function') {
      throw new Error('Underlying votes repo does not implement create');
    }
    return await this.votes.create(input);
  }

  async getById(id: string): Promise<any> {
    if (!this.votes || typeof this.votes.getById !== 'function') return null;
    return await this.votes.getById(id);
  }

  async getByBillId(billId: string): Promise<any[]> {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') return [];
    return await this.votes.getByBillId(billId);
  }

  async getByUserId(userId: string): Promise<any[]> {
    if (!this.votes || typeof this.votes.getByUserId !== 'function') return [];
    return await this.votes.getByUserId(userId);
  }

  async update(id: string, data: any): Promise<any> {
    if (!this.votes || typeof this.votes.update !== 'function') {
      throw new Error('Underlying votes repo does not implement update');
    }
    return await this.votes.update(id, data);
  }

  async delete(id: string): Promise<any> {
    if (!this.votes || typeof this.votes.delete !== 'function') {
      throw new Error('Underlying votes repo does not implement delete');
    }
    return await this.votes.delete(id);
  }

  async getAll(filter: any): Promise<any[]> {
    if (!this.votes || typeof this.votes.getAll !== 'function') return [];
    return await this.votes.getAll(filter || {});
  }

  async hasUserVotedOnBill(userId: string, billId: string): Promise<boolean> {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') return false;
    const rows = await this.votes.getByBillId(billId);
    return rows.some((r: any) => r.userId === userId || r.user_id === userId);
  }

  async getVoteCounts(
    billId: string
  ): Promise<{ aye: number; nay: number; abstain: number; total: number }> {
    if (!this.votes || typeof this.votes.getByBillId !== 'function') {
      return { aye: 0, nay: 0, abstain: 0, total: 0 };
    }
    const rows = await this.votes.getByBillId(billId);
    const aye = rows.filter((r: any) => String(r.vote) === 'aye').length;
    const nay = rows.filter((r: any) => String(r.vote) === 'nay').length;
    const abstain = rows.filter((r: any) => String(r.vote) === 'abstain').length;
    return { aye, nay, abstain, total: rows.length };
  }

  validateVoteData(data: any): void {
    if (!data || !data.billId || !data.userId) throw new Error('Missing required fields');
    const allowed = ['aye', 'nay', 'abstain', 'yes', 'no'];
    if (!data.vote || !allowed.includes(String(data.vote))) throw new Error('Invalid vote type');
  }
}
