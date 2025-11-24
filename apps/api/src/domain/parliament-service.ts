/**
 * @ignore
 */

import { ParliamentDB, prismaDb } from '../services/prisma-database.service.js';

/**
 * Represents a parliamentary chamber within a game instance.
 * e.g., House of Commons or House of Lords.
 */
export interface Chamber {
  id: string;
  gameId: string;
  name: string;
  type: 'commons' | 'lords';
  maxSeats: number;
  quorumPercentage: number;
  createdAt: string;
}

/**
 * A motion (proposal) within a chamber that may go to debate and voting.
 */
export interface Motion {
  id: string;
  gameId: string;
  chamberId: string;
  proposerId: string;
  type: 'debate' | 'vote' | 'amendment' | 'procedural';
  title: string;
  description?: string;
  status: 'proposed' | 'debate' | 'voting' | 'completed';
  votingStarted?: string;
  votingEnded?: string;
  result?: 'passed' | 'failed';
  createdAt: string;
}

/**
 * A debate scheduled for a motion in a chamber.
 */
export interface Debate {
  id: string;
  gameId: string;
  motionId: string;
  chamberId: string;
  startTime: string;
  duration: number;
  speakingOrder: string[];
  timePerSpeaker: number;
  status: 'scheduled' | 'active' | 'completed';
  currentSpeakerIndex: number;
  speeches?: Speech[];
  createdAt: string;
}

/**
 * A speech made during a debate by a user in the chamber.
 */
export interface Speech {
  id: string;
  debateId: string;
  userId: string;
  content: string;
  duration: number;
  createdAt: string;
}

/**
 * A vote cast by a user on a motion.
 */
export interface Vote {
  id: string;
  gameId: string;
  motionId: string;
  debateId: string;
  userId: string;
  vote: 'aye' | 'no' | 'abstain';
  createdAt: string;
}

/**
 * Aggregated vote results for a motion.
 */
export interface VoteResults {
  total: number;
  aye: number;
  no: number;
  abstain: number;
}

/**
 * Service responsible for creating and managing chambers, motions, debates and votes.
 */
export class ParliamentService {
  /**
   * Create a new parliamentary chamber for a game
   * @param data - Chamber creation payload
   */
  async createChamber(data: {
    gameId: string;
    type: 'commons' | 'lords';
    name: string;
    maxSeats: number;
    quorumPercentage?: number;
  }): Promise<Chamber> {
    const chamberData = {
      ...data,
      quorumPercentage: data.quorumPercentage ?? 50,
    };

    const result = await ParliamentDB.createChamber(chamberData);
    return result as unknown as Chamber;
  }

  async getChamber(id: string): Promise<Chamber | null> {
    const result = await ParliamentDB.getChamber(id);
    return result as unknown as Chamber | null;
  }

  async listChambers(gameId: string): Promise<Chamber[]> {
    const results = await ParliamentDB.listChambers({ gameId });
    return results as unknown as Chamber[];
  }

  /**
   * Create a motion in a chamber (proposal for debate/vote)
   * @param data - Motion creation payload
   */
  async createMotion(data: {
    gameId: string;
    chamberId: string;
    proposerId: string;
    type: 'debate' | 'vote' | 'amendment' | 'procedural';
    title: string;
    description?: string;
  }): Promise<Motion> {
    // Verify chamber exists
    const chamber = await this.getChamber(data.chamberId);
    if (!chamber) {
      throw new Error('Chamber not found');
    }

    const motionData = {
      ...data,
      status: 'proposed' as const,
    };

    const result = await ParliamentDB.createMotion(motionData);
    return result as unknown as Motion;
  }

  async getMotion(id: string): Promise<Motion | null> {
    const result = await ParliamentDB.getMotion(id);
    return result as unknown as Motion | null;
  }

  async listMotions(filters: { gameId?: string; chamberId?: string } = {}): Promise<Motion[]> {
    const where: Record<string, string> = {};
    if (filters.gameId) where.gameId = filters.gameId;
    if (filters.chamberId) where.chamberId = filters.chamberId;

    const results = await ParliamentDB.listMotions(where);
    return results as unknown as Motion[];
  }

  /**
   * Schedule a debate for an existing motion
   * Uses a transaction to create the debate and update the motion status
   * @param data - Scheduling details for the debate
   */
  async scheduleDebate(data: {
    motionId: string;
    startTime: string;
    duration: number;
    speakingOrder?: string[];
    timePerSpeaker?: number;
  }): Promise<Debate> {
    // Verify motion exists and is in proposed status
    const motion = await this.getMotion(data.motionId);
    if (!motion) {
      throw new Error('Motion not found');
    }

    if (motion.status !== 'proposed') {
      throw new Error('Motion must be in proposed status to schedule debate');
    }

    const debateData = {
      gameId: motion.gameId,
      motionId: data.motionId,
      chamberId: motion.chamberId,
      startTime: data.startTime,
      duration: data.duration,
      speakingOrder: data.speakingOrder ?? [],
      timePerSpeaker: data.timePerSpeaker ?? 180,
      status: 'scheduled' as const,
      currentSpeakerIndex: 0,
      speeches: [],
    };

    // Use transaction to ensure both operations succeed or fail together
    const result = await prismaDb.transaction(async () => {
      // Create debate
      const debate = await ParliamentDB.createDebate(debateData);

      // Update motion status
      await ParliamentDB.updateMotion(data.motionId, { status: 'debate' });

      return debate;
    });

    return result as unknown as Debate;
  }

  async getDebate(id: string): Promise<Debate | null> {
    const result = await ParliamentDB.getDebate(id);
    return result as unknown as Debate | null;
  }

  /**
   * Cast a vote on a motion for a user
   * @param data - Vote payload including motion and user identifiers
   */
  async castVote(data: {
    motionId: string;
    userId: string;
    vote: 'aye' | 'no' | 'abstain';
  }): Promise<Vote> {
    // Verify motion exists and is in voting status
    const motion = await this.getMotion(data.motionId);
    if (!motion) {
      throw new Error('Motion not found');
    }

    if (motion.status !== 'voting') {
      throw new Error('Motion is not currently open for voting');
    }

    // Check if user already voted
    const existingVote = await ParliamentDB.voteExists({
      motionId: data.motionId,
      userId: data.userId,
    });

    if (existingVote) {
      throw new Error('You have already voted on this motion');
    }

    // Get debate for this motion
    const debates = await ParliamentDB.listMotions({ id: data.motionId });
    if (!debates.length || !(debates[0] as unknown as { debate?: { id: string } }).debate) {
      throw new Error('No active debate found for this motion');
    }

    const debateId = (debates[0] as unknown as { debate: { id: string } }).debate.id;

    const voteData = {
      gameId: motion.gameId,
      motionId: data.motionId,
      debateId,
      userId: data.userId,
      vote: data.vote,
    };

    const result = await ParliamentDB.createVote(voteData);
    return result as unknown as Vote;
  }

  async getVoteResults(motionId: string): Promise<VoteResults> {
    const votes = await ParliamentDB.listVotes({ motionId });

    const results = {
      total: votes.length,
      aye: votes.filter(v => (v as unknown as Vote).vote === 'aye').length,
      no: votes.filter(v => (v as unknown as Vote).vote === 'no').length,
      abstain: votes.filter(v => (v as unknown as Vote).vote === 'abstain').length,
    };

    return results;
  }

  async startVoting(motionId: string): Promise<Motion> {
    const motion = await this.getMotion(motionId);
    if (!motion) {
      throw new Error('Motion not found');
    }

    if (motion.status !== 'debate') {
      throw new Error('Motion must complete debate before voting');
    }

    const updatedMotion = await ParliamentDB.updateMotion(motionId, {
      status: 'voting',
      votingStarted: new Date().toISOString(),
    });

    return updatedMotion as unknown as Motion;
  }

  async closeVoting(motionId: string): Promise<Motion> {
    const motion = await this.getMotion(motionId);
    if (!motion) {
      throw new Error('Motion not found');
    }

    if (motion.status !== 'voting') {
      throw new Error('Motion is not currently in voting');
    }

    // Calculate results
    const results = await this.getVoteResults(motionId);
    const result = results.aye > results.no ? 'passed' : 'failed';

    // Use transaction to ensure atomic update
    const updatedMotion = await prismaDb.transaction(async () => {
      return await ParliamentDB.updateMotion(motionId, {
        status: 'completed',
        votingEnded: new Date().toISOString(),
        result,
      });
    });

    return updatedMotion as unknown as Motion;
  }
}
