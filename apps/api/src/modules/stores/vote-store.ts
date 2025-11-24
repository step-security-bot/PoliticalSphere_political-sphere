type Vote = {
  id?: string;
  billId: string;
  userId: string;
  vote: 'aye' | 'nay' | 'abstain' | 'yes' | 'no';
  timestamp?: string;
};

interface VotesApi {
  create(data: Vote): Promise<Vote>;
  getById(id: string): Promise<Vote | null>;
  getByBillId(billId: string): Promise<Vote[]>;
  getByUserId(userId: string): Promise<Vote[]>;
  update(id: string, data: Partial<Vote>): Promise<Vote>;
  delete(id: string): Promise<boolean>;
  getAll(filter?: Partial<Pick<Vote, 'billId' | 'userId'>>): Promise<Vote[]>;
}

/**
 * VoteStore is a thin wrapper around a `VotesApi` implementation that provides
 * validation and convenience helpers for vote-related operations used by the
 * application domain. It delegates persistence to the underlying `VotesApi`.
 *
 * Public methods include creating votes, retrieving by id/bill/user, updating
 * and computing aggregated vote counts for a bill.
 */
export default class VoteStore {
  private api: VotesApi;

  constructor(api: VotesApi) {
    this.api = api;
  }

  validateVoteData(data: Partial<Vote>): void {
    if (!data || typeof data !== 'object') throw new Error('Missing required fields');
    if (!data.billId || !data.userId || !data.vote) throw new Error('Missing required fields');
    const allowed = new Set(['aye', 'nay', 'abstain', 'yes', 'no']);
    if (!allowed.has(String(data.vote))) throw new Error('Invalid vote type');
  }

  async create(data: Vote): Promise<Vote> {
    // Intentionally delegate to DB to allow surfacing DB errors in tests
    return this.api.create(data);
  }

  async getById(id: string): Promise<Vote | null> {
    return this.api.getById(id);
  }

  async getByBillId(billId: string): Promise<Vote[]> {
    return this.api.getByBillId(billId);
  }

  async getByUserId(userId: string): Promise<Vote[]> {
    return this.api.getByUserId(userId);
  }

  async update(id: string, data: Partial<Vote>): Promise<Vote> {
    return this.api.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.api.delete(id);
  }

  async getAll(filter?: Partial<Pick<Vote, 'billId' | 'userId'>>): Promise<Vote[]> {
    return this.api.getAll(filter);
  }

  async hasUserVotedOnBill(userId: string, billId: string): Promise<boolean> {
    const votes = await this.api.getByBillId(billId);
    return votes.some(v => v.userId === userId);
  }

  async getVoteCounts(
    billId: string
  ): Promise<{ aye: number; nay: number; abstain: number; total: number }> {
    const votes = await this.api.getByBillId(billId);
    const counts = { aye: 0, nay: 0, abstain: 0 };
    for (const v of votes) {
      const val = v.vote === 'yes' ? 'aye' : v.vote === 'no' ? 'nay' : v.vote;
      if (val === 'aye' || val === 'nay' || val === 'abstain') counts[val] += 1;
    }
    return { ...counts, total: votes.length };
  }
}
