import { type CreateVoteInput, CreateVoteSchema, type Vote } from '@political-sphere/shared';

/**
 * @ignore
 */

import { getDatabase } from '../stores/index.js';

/**
 * VoteService provides operations related to vote creation and retrieval.
 * It wraps the underlying database store and enforces domain rules such as
 * preventing double voting and validating referenced entities.
 */
/**
 * VoteService exposes domain operations for casting and querying votes.
 *
 * Responsibilities:
 * - Validate vote payloads and enforce domain rules (no double-voting)
 * - Map store records to domain types and provide aggregate helpers
 *
 * Storage is delegated to the application vote store obtained from
 * `getDatabase()` to keep this service focused on business rules.
 */
export class VoteService {
  // Lazy getter to avoid stale DB connections in tests
  private get db() {
    return getDatabase();
  }

  /**
   * Cast a vote on a bill.
   * @param input - The vote creation payload
   * @returns The recorded Vote
   * @throws Error when the bill or user does not exist or the user already voted
   */
  async castVote(input: CreateVoteInput): Promise<Vote> {
    // Validate input
    CreateVoteSchema.parse(input);

    // Verify bill exists
    const bill = await this.db.bills.getById(input.billId);
    if (!bill) {
      throw new Error('Bill does not exist');
    }

    // Verify user exists
    const user = await this.db.users.getById(input.userId);
    if (!user) {
      throw new Error('User does not exist');
    }

    // Check if user has already voted on this bill (await the async store method)
    const hasVoted = await this.db.votes.hasUserVotedOnBill(input.userId, input.billId);
    if (hasVoted) {
      throw new Error('User has already voted on this bill');
    }

    const result = await this.db.votes.create(input);
    // Map database result to Vote type
    return {
      id: result.id as string,
      billId: result.billId as string,
      userId: result.userId as string,
      vote: result.vote as 'aye' | 'nay' | 'abstain',
      createdAt: new Date(result.createdAt as string),
    } as Vote;
  }

  /**
   * Retrieve a vote by its identifier.
   * @param id - Vote ID to lookup
   */
  async getVoteById(id: string): Promise<Vote | null> {
    return this.db.votes.getById(id);
  }

  /**
   * List votes for a bill
   * @param billId - Bill ID to gather votes for
   */
  async getBillVotes(billId: string): Promise<Vote[]> {
    return this.db.votes.getByBillId(billId);
  }

  /**
   * List votes cast by a user
   * @param userId - User ID to lookup votes
   */
  async getUserVotes(userId: string): Promise<Vote[]> {
    return this.db.votes.getByUserId(userId);
  }

  /**
   * Get aggregated counts for a bill votes.
   * @param billId - Bill ID to aggregate
   */
  async getVoteCounts(billId: string): Promise<{ aye: number; nay: number; abstain: number }> {
    return this.db.votes.getVoteCounts(billId);
  }
}
