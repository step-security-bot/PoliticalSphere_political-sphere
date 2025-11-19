/**
 * Voting System Examples
 *
 * Demonstrates secure voting implementation with:
 * - One vote per user enforcement
 * - Democratic integrity validation
 * - Immutable vote records
 * - Audit trail logging
 *
 * Standards: Constitutional governance requirements
 */

import type { Request, Response } from 'express';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const CastVoteSchema = z.object({
  billId: z.string().regex(/^bill-\d+$/),
  position: z.enum(['for', 'against', 'abstain']),
  reason: z.string().max(5000).optional(),
  isPublic: z.boolean().default(true),
});

// ============================================================================
// EXAMPLE 1: Cast Vote (Democratic Integrity)
// ============================================================================

export async function castVote(req: Request, res: Response): Promise<void> {
  const client = await db.getClient();

  try {
    // Start transaction for atomicity
    await client.query('BEGIN');

    // 1. Validate input
    const data = CastVoteSchema.parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // 2. Verify bill exists and is in voting phase
    const billResult = await client.query(
      `SELECT id, status, voting_starts_at, voting_ends_at 
       FROM bills 
       WHERE id = $1 FOR UPDATE`, // Lock for consistency
      [data.billId]
    );

    const bill = billResult.rows[0];

    if (!bill) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    if (bill.status !== 'active_voting') {
      await client.query('ROLLBACK');
      res.status(400).json({
        error: 'Bill is not accepting votes',
        currentStatus: bill.status,
      });
      return;
    }

    // 3. Check voting window
    const now = new Date();
    if (now < new Date(bill.voting_starts_at) || now > new Date(bill.voting_ends_at)) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Voting window has closed' });
      return;
    }

    // 4. CHECK: One vote per user (CRITICAL - Democratic Integrity)
    const existingVoteResult = await client.query(
      'SELECT id FROM votes WHERE bill_id = $1 AND user_id = $2',
      [data.billId, userId]
    );

    if (existingVoteResult.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'Vote already cast',
        message: 'Users can only vote once per bill. Votes are immutable.',
      });
      return;
    }

    // 5. Record vote (immutable - no UPDATE capability)
    const voteResult = await client.query(
      `INSERT INTO votes (bill_id, user_id, position, weight, reason, is_public, created_at)
       VALUES ($1, $2, $3, 1.0, $4, $5, NOW())
       RETURNING id, bill_id, user_id, position, weight, created_at`,
      [data.billId, userId, data.position, data.reason || null, data.isPublic]
    );

    const vote = voteResult.rows[0];

    // 6. Update bill vote tallies
    const columnMap = {
      for: 'votes_for',
      against: 'votes_against',
      abstain: 'votes_abstain',
    };
    const column = columnMap[data.position];

    await client.query(
      `UPDATE bills SET ${column} = ${column} + 1, updated_at = NOW() WHERE id = $1`,
      [data.billId]
    );

    // 7. Create audit log (tamper-evident)
    await client.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at)
       VALUES ('VOTE_CAST', 'vote', $1, $2, $3, NOW())`,
      [
        vote.id,
        userId,
        JSON.stringify({
          billId: data.billId,
          position: data.position,
          isPublic: data.isPublic,
          timestamp: vote.created_at,
        }),
      ]
    );

    // 8. Commit transaction
    await client.query('COMMIT');

    // 9. Send response
    res.status(201).json({
      vote: {
        id: vote.id,
        billId: vote.bill_id,
        position: vote.position,
        weight: vote.weight,
        createdAt: vote.created_at,
      },
      message: 'Vote recorded successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Vote casting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// ============================================================================
// EXAMPLE 2: Get Vote Results
// ============================================================================

export async function getVoteResults(req: Request, res: Response): Promise<void> {
  try {
    const { billId } = req.params;

    // Validate bill ID format
    if (!/^bill-\d+$/.test(billId)) {
      res.status(400).json({ error: 'Invalid bill ID format' });
      return;
    }

    // Get aggregated results
    const result = await db.query(
      `SELECT 
        b.id,
        b.title,
        b.status,
        b.votes_for,
        b.votes_against,
        b.votes_abstain,
        b.voting_starts_at,
        b.voting_ends_at,
        (b.votes_for + b.votes_against + b.votes_abstain) as total_votes
       FROM bills b
       WHERE b.id = $1`,
      [billId]
    );

    const bill = result.rows[0];

    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    // Calculate percentages
    const totalVotes = bill.total_votes || 1; // Avoid division by zero
    const results = {
      billId: bill.id,
      title: bill.title,
      status: bill.status,
      votingPeriod: {
        start: bill.voting_starts_at,
        end: bill.voting_ends_at,
      },
      results: {
        for: {
          count: bill.votes_for,
          percentage: ((bill.votes_for / totalVotes) * 100).toFixed(2),
        },
        against: {
          count: bill.votes_against,
          percentage: ((bill.votes_against / totalVotes) * 100).toFixed(2),
        },
        abstain: {
          count: bill.votes_abstain,
          percentage: ((bill.votes_abstain / totalVotes) * 100).toFixed(2),
        },
        total: totalVotes,
      },
    };

    res.status(200).json(results);
  } catch (error) {
    console.error('Get vote results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// EXAMPLE 3: Get User's Vote on Bill
// ============================================================================

export async function getUserVote(req: Request, res: Response): Promise<void> {
  try {
    const { billId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await db.query(
      `SELECT id, position, reason, is_public, created_at
       FROM votes
       WHERE bill_id = $1 AND user_id = $2`,
      [billId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'No vote found',
        hasVoted: false,
      });
      return;
    }

    const vote = result.rows[0];

    res.status(200).json({
      hasVoted: true,
      vote: {
        id: vote.id,
        position: vote.position,
        reason: vote.is_public ? vote.reason : null, // Respect privacy
        createdAt: vote.created_at,
      },
    });
  } catch (error) {
    console.error('Get user vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import express from 'express';
import { authenticate } from './authentication.example';
import { castVote, getVoteResults, getUserVote } from './voting.example';

const app = express();

// Cast vote (authenticated users only)
app.post('/api/votes', authenticate, castVote);

// Get results (public)
app.get('/api/bills/:billId/results', getVoteResults);

// Get user's vote (authenticated)
app.get('/api/bills/:billId/my-vote', authenticate, getUserVote);
*/
