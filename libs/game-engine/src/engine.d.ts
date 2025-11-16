/**
 * Type definitions for the game engine
 * @module libs/game-engine/src/engine
 */

/**
 * Player in the game
 */
export interface Player {
  id: string;
  displayName: string;
  createdAt: string;
  verifiedAge: number | null;
  contentRating: string;
}

/**
 * Proposal for legislation or policy
 */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  createdAt: string;
  status: 'proposed' | 'debate' | 'voting' | 'enacted' | 'rejected' | 'flagged';
  debateId?: string | null;
  moderationStatus?: string;
  flaggedReasons?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string | null;
  contentRating?: string;
}

/**
 * Vote on a proposal
 */
export interface Vote {
  id: string;
  playerId: string;
  proposalId: string;
  choice: 'for' | 'against' | 'abstain';
  timestamp: string;
  createdAt: string; // Required field
}

/**
 * Debate session for a proposal
 */
export interface Debate {
  id: string;
  proposalId: string;
  speakingOrder: string[];
  currentSpeakerIndex: number;
  timeLimit: number;
  startedAt: string;
  createdAt: string;
  status: 'active' | 'completed';
}

/**
 * Speech made during a debate
 */
export interface Speech {
  id: string;
  debateId: string;
  speakerId: string;
  content: string;
  timestamp: string;
}

/**
 * Economic state of the game
 */
export interface Economy {
  treasury: number;
  inflationRate: number;
  unemploymentRate: number;
}

/**
 * Turn/phase information
 */
export interface Turn {
  turnNumber: number;
  phase: 'lobby' | 'debate' | 'voting' | 'enacted';
}

/**
 * Complete game state
 */
export interface GameState {
  id: string;
  name: string;
  players: Player[];
  proposals: Proposal[];
  votes: Vote[];
  debates?: Debate[];
  speeches?: Speech[];
  economy: Economy;
  turn: Turn;
  createdAt: string;
  updatedAt: string;
  contentRating: string;
  moderationEnabled: boolean;
  ageVerificationRequired: boolean;
}

/**
 * Action to propose new legislation
 */
export interface ProposeAction {
  type: 'propose';
  playerId?: string;
  payload: {
    title: string;
    description: string;
    proposerId?: string;
  };
}

/**
 * Action to start a debate
 */
export interface StartDebateAction {
  type: 'start_debate';
  playerId?: string;
  payload: {
    proposalId: string;
    speakingOrder?: string[];
  };
}

/**
 * Action to speak in a debate
 */
export interface SpeakAction {
  type: 'speak';
  playerId?: string;
  payload: {
    debateId: string;
    speakerId: string;
    content: string;
  };
}

/**
 * Action to vote on a proposal
 */
export interface VoteAction {
  type: 'vote';
  playerId?: string;
  payload: {
    proposalId: string;
    playerId?: string;
    choice: 'for' | 'against' | 'abstain';
  };
}

/**
 * Action to advance to the next turn
 */
export interface AdvanceTurnAction {
  type: 'advance_turn';
  playerId?: string;
  payload?: Record<string, unknown>;
}

/**
 * Union type for all possible player actions
 */
export type PlayerAction =
  | ProposeAction
  | StartDebateAction
  | SpeakAction
  | VoteAction
  | AdvanceTurnAction;

/**
 * Random number generator function
 */
export type RNG = () => number;

/**
 * Advances the game state by applying a sequence of player actions deterministically.
 *
 * This is a pure function that does not mutate the input game state.
 * All randomness is controlled by the provided seed for deterministic replay.
 *
 * @param game - The current game state
 * @param actions - Array of player actions to apply in order
 * @param seed - Numeric seed for deterministic random number generation (default: 1)
 * @returns A new game state with all actions applied
 *
 * @example
 * ```typescript
 * const initialState: GameState = {
 *   id: 'game-1',
 *   name: 'Test Game',
 *   players: [{ id: 'player-1', displayName: 'Alice', createdAt: new Date().toISOString(), verifiedAge: 25, contentRating: 'PG' }],
 *   proposals: [],
 *   votes: [],
 *   economy: { treasury: 100000, inflationRate: 0.02, unemploymentRate: 0.05 },
 *   turn: { turnNumber: 1, phase: 'lobby' },
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString(),
 *   contentRating: 'PG',
 *   moderationEnabled: true,
 *   ageVerificationRequired: false
 * };
 *
 * const actions: PlayerAction[] = [
 *   {
 *     type: 'propose',
 *     playerId: 'player-1',
 *     payload: { title: 'Budget Reform', description: 'Increase education funding' }
 *   }
 * ];
 *
 * const newState = advanceGameState(initialState, actions, 42);
 * console.log(newState.proposals.length); // 1
 * ```
 */
export function advanceGameState(
  game: GameState,
  actions?: PlayerAction[],
  seed?: number
): GameState;

/**
 * Creates a deterministic pseudo-random number generator using the Mulberry32 algorithm.
 *
 * @param seed - Initial seed value for the RNG
 * @returns A function that returns pseudo-random numbers between 0 and 1
 *
 * @example
 * ```typescript
 * const rng = mulberry32(12345);
 * const random1 = rng(); // Always returns the same value for seed 12345
 * const random2 = rng(); // Next value in the deterministic sequence
 * ```
 */
export function mulberry32(seed: number): RNG;

/**
 * Generates a deterministic ID with a given prefix using the provided RNG.
 *
 * @param prefix - String prefix for the ID (e.g., 'proposal', 'debate', 'speech')
 * @param rng - Random number generator function
 * @returns A deterministic ID string in the format `${prefix}-${base36}`
 *
 * @example
 * ```typescript
 * const rng = mulberry32(42);
 * const id = deterministicId('proposal', rng); // e.g., 'proposal-2n8k4l'
 * ```
 */
export function deterministicId(prefix: string, rng: RNG): string;
