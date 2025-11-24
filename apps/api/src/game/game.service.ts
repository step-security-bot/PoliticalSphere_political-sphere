/**
 * Game Service
 * Manages game state and actions using the game engine
 * Consolidated from game-server with full game phase management and WebSocket integration
 */

import { v4 as uuidv4 } from 'uuid';

import type { Prisma } from '@prisma/client';
import type {
  GameState as EngineGameState,
  PlayerAction as EnginePlayerAction,
} from '@political-sphere/game-engine';
import { advanceGameState } from '@political-sphere/game-engine';
import { gameEventEmitter } from '../events';
import { prisma } from '../services/prisma-database.service.js';
import { error as loggerError } from '../utils/logger';
import ComplianceService from '../modules/complianceService';

type ComplianceModule = typeof ComplianceService & {
  logComplianceEvent: (event: Record<string, unknown>) => string;
};

const compliance = ComplianceService as ComplianceModule;

/**
 * GameState extends the engine-provided state with service-level fields used by
 * the API and game services. It includes strong typing for players, phase, and
 * the per-subsystem state used throughout the simulation.
 */
/**
 * GameState - API-facing extension of the engine GameState with service-level
 * fields (players, phase, settings) used by the API and persistence layer.
 */
export interface GameState extends Omit<EngineGameState, 'players'> {
  currentTurn: number; // Service uses currentTurn instead of turn object
  phase: 'setup' | 'legislative' | 'executive' | 'judicial' | 'media' | 'election' | 'finished';
  players: Array<{
    id: string;
    username: string;
    reputation: number;
    joinedAt: string;
    party?: string;
    role?: 'mp' | 'minister' | 'judge' | 'journalist';
    verifiedAge?: number | null;
    contentRating?: string;
  }>;
  settings: {
    maxPlayers: number;
    turnDuration: number; // seconds
    debateDuration: number; // seconds
    maxTurns: number;
  };
  status: 'waiting' | 'active' | 'paused' | 'finished';
  contentRating: string;
  moderationEnabled: boolean;
  ageVerificationRequired: boolean;
  // System integration state
  parliamentState: {
    chambersCreated: boolean;
    activeMotions: string[];
    passedLaws: string[];
  };
  governmentState: {
    governmentId?: string;
    ministers: Array<{ userId: string; portfolio: string }>;
    executiveActions: string[];
  };
  judiciaryState: {
    judges: string[];
    activeCases: string[];
    rulings: string[];
  };
  mediaState: {
    pressReleases: string[];
    polls: string[];
    publicOpinion: { approval: number; trust: number };
  };
  electionState: {
    nextElectionDate?: string;
    currentGovernmentApproval: number;
    electionTriggered: boolean;
  };
  winConditions: {
    stability: number; // 0-100, based on government approval and economic factors
    legislation: number; // number of laws passed
    publicTrust: number; // 0-100, based on media and judicial decisions
  };
  // Additional game server state
  debates?: Debate[];
  speeches?: Speech[];
}

// Additional interfaces from game-server
interface Debate {
  id: string;
  proposalId: string;
  speakingOrder: string[];
  currentSpeakerIndex: number;
  timeLimit: number;
  startedAt: string;
  createdAt: string;
  status: 'active' | 'completed';
}

interface Speech {
  id: string;
  debateId: string;
  speakerId: string;
  content: string;
  timestamp: string;
}

/**
 * PlayerAction records user-initiated actions relevant to the game engine and service.
 */
export interface PlayerAction {
  type: 'propose' | 'vote' | 'speak' | 'start_debate' | 'advance_turn' | 'advance_phase';
  playerId: string;
  payload?: Record<string, unknown>;
}

// Game storage using Prisma database

/**
 * GameService manages persistent game instances and translates player
 * actions into engine events. It persists `GameState` to the database,
 * emits audit logs, and coordinates cross-subsystem integration (parliament,
 * government, judiciary, media, elections). Prefer using the exported
 * `gameService` singleton in routes; instantiate `GameService` directly in
 * tests for isolation.
 */
/**
 * GameService - manages persistent game instances, maps player actions
 * to engine events and coordinates cross-subsystem integration.
 */
export class GameService {
  /**
   * Create a new game instance persisted in the database and seeded with defaults.
   * @param creatorId - User id creating the game
   * @param _creatorUsername - Username for audit/logging
   * @param _name - Optional game name
   * @returns A fully initialized GameState object
   */
  /**
   * Update game state in database
   * @private
   * @param gameId - Game identifier
   * @param gameState - Updated game state to persist
   */
  private async updateGameState(gameId: string, gameState: GameState): Promise<void> {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        state: gameState as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  private async recordAuditLog(entry: {
    category: string;
    action: string;
    userId: string;
    resource?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          category: entry.category,
          action: entry.action,
          userId: entry.userId,
          resource: entry.resource ?? 'game',
          details: (entry.details ?? {}) as Prisma.InputJsonValue,
          complianceFrameworks: ['DSA'],
          timestamp: new Date(),
        },
      });
    } catch (error) {
      loggerError('Failed to record audit log', { error: (error as Error).message });
    }
  }

  async createGame(creatorId: string, _creatorUsername: string, _name: string): Promise<GameState> {
    const gameId = uuidv4();
    const now = new Date().toISOString();

    const game: GameState = {
      id: gameId,
      name: _name || 'New Game',
      createdAt: now,
      updatedAt: now,
      currentTurn: 0, // Start at 0, will be incremented when game starts
      phase: 'setup',
      players: [],
      proposals: [],
      votes: [],
      economy: { treasury: 100000, inflationRate: 0.02, unemploymentRate: 0.05 },
      turn: { turnNumber: 0, phase: 'lobby' },
      contentRating: 'PG',
      moderationEnabled: true,
      ageVerificationRequired: true,
      // Initialize system states
      parliamentState: {
        chambersCreated: false,
        activeMotions: [],
        passedLaws: [],
      },
      governmentState: {
        ministers: [],
        executiveActions: [],
      },
      judiciaryState: {
        judges: [],
        activeCases: [],
        rulings: [],
      },
      mediaState: {
        pressReleases: [],
        polls: [],
        publicOpinion: { approval: 50, trust: 50 },
      },
      electionState: {
        currentGovernmentApproval: 50,
        electionTriggered: false,
      },
      winConditions: {
        stability: 50,
        legislation: 0,
        publicTrust: 50,
      },
      settings: {
        maxPlayers: 20,
        turnDuration: 300,
        debateDuration: 180,
        maxTurns: 10,
      },
      status: 'waiting',
    };

    // Persist game to database
    await prisma.game.create({
      data: {
        id: gameId,
        name: game.name,
        state: game as unknown as Prisma.InputJsonValue,
      },
    });

    await this.recordAuditLog({
      category: 'game_management',
      action: 'game_created',
      userId: creatorId,
      resource: 'game',
      details: { gameId, gameName: game.name },
    });

    // Log game creation for compliance
    compliance.logComplianceEvent({
      category: 'game_management',
      action: 'game_created',
      userId: creatorId,
      resource: 'game',
      details: { gameId, gameName: name },
      complianceFrameworks: ['DSA'],
    });

    return game;
  }

  /**
   * Get game by ID
   */
  async getGame(gameId: string): Promise<GameState | null> {
    const gameRecord = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!gameRecord) {
      return null;
    }

    const state = gameRecord.state as unknown as GameState;
    // Clone to avoid mutating cached state objects in memory
    return JSON.parse(JSON.stringify(state)) as GameState;
  }

  /**
   * Get all games (for lobby listing)
   */
  async listGames(): Promise<GameState[]> {
    const gameRecords = await prisma.game.findMany();
    return gameRecords.map(record => record.state as unknown as GameState);
  }

  /**
   * Get games for a specific player
   */
  async getPlayerGames(playerId: string): Promise<GameState[]> {
    const allGames = await this.listGames();
    return allGames.filter(game => game.players.some(player => player.id === playerId));
  }

  /**
   * Join an existing game
   */
  async joinGame(gameId: string, playerId: string, username: string): Promise<GameState> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status === 'finished') {
      throw new Error('Game has finished');
    }

    if (game.players.length >= game.settings.maxPlayers) {
      throw new Error('Game is full');
    }

    if (game.players.some(p => p.id === playerId)) {
      throw new Error('Already in this game');
    }

    // Age verification check if required
    let verifiedAge: number | null = null;
    if (game.ageVerificationRequired) {
      try {
        const verification = await this.checkAgeVerification(playerId);

        if (verification.verified) {
          verifiedAge = verification.age ?? null;
        } else if (!process.env.API_BASE_URL) {
          // Import age verification service dynamically when local checks are required
          const { default: AgeVerificationService } = await import(
            '../modules/ageVerificationService.js'
          );
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic import requires any for unknown service interface
          const fallbackVerification = await (AgeVerificationService as any).getVerificationStatus(
            playerId
          );
          if (!fallbackVerification?.verified) {
            throw new Error('Age verification required');
          }
          verifiedAge = fallbackVerification.age;
        } else {
          throw new Error('Age verification required');
        }
      } catch (error) {
        loggerError('Age verification check failed', { error: (error as Error).message, playerId });
        throw new Error('Age verification required');
      }
    }

    const player = {
      id: playerId,
      username,
      reputation: 0,
      joinedAt: new Date().toISOString(),
      verifiedAge,
      contentRating: game.contentRating || 'PG',
    };

    game.players.push(player);
    game.updatedAt = new Date().toISOString();

    // Update game in database
    await this.updateGameState(gameId, game);

    await this.recordAuditLog({
      category: 'game_management',
      action: 'player_joined',
      userId: playerId,
      resource: 'game',
      details: { gameId, playerName: username },
    });

    // Log player join for compliance
    compliance.logComplianceEvent({
      category: 'game_management',
      action: 'player_joined',
      userId: playerId,
      resource: 'game',
      details: { gameId, playerName: username },
      complianceFrameworks: ['DSA'],
    });

    return game;
  }

  /**
   * Process a player action
   */
  async processAction(gameId: string, action: PlayerAction): Promise<GameState> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'active' && game.status !== 'waiting') {
      throw new Error('Game is not active');
    }

    // Verify player is in game
    const player = game.players.find(p => p.id === action.playerId);
    if (!player) {
      throw new Error('Player not in this game');
    }

    // Handle special actions that don't go through the game engine
    if (action.type === 'advance_phase') {
      return this.advancePhase(gameId, action.playerId);
    }

    // Enrich payload with implicit player identifiers so clients don't need to duplicate
    const enrichedAction: PlayerAction = {
      ...action,
      payload: { ...(action.payload || {}) },
    };
    if (
      enrichedAction.type === 'vote' &&
      enrichedAction.payload &&
      !enrichedAction.payload.playerId
    ) {
      enrichedAction.payload.playerId = enrichedAction.playerId;
    }
    if (
      enrichedAction.type === 'propose' &&
      enrichedAction.payload &&
      !enrichedAction.payload.proposerId
    ) {
      enrichedAction.payload.proposerId = enrichedAction.playerId;
    }

    // Convert service GameState to engine GameState format
    // Map our phases to engine phases for compatibility
    const phaseMapping: Record<string, 'lobby' | 'debate' | 'voting' | 'enacted'> = {
      setup: 'lobby',
      legislative: 'debate',
      executive: 'enacted',
      judicial: 'voting',
      media: 'lobby',
      election: 'voting',
      finished: 'enacted',
    };

    const reversePhaseMapping: Record<string, GameState['phase']> = {
      lobby: 'setup',
      debate: 'legislative',
      voting: 'judicial',
      enacted: 'executive',
    };

    const engineState: EngineGameState = {
      ...game,
      players: game.players.map(p => ({
        id: p.id,
        displayName: p.username,
        createdAt: p.joinedAt,
        verifiedAge: null,
        contentRating: game.contentRating || 'PG',
      })),
      turn: {
        turnNumber: game.currentTurn,
        phase: phaseMapping[game.phase] || 'lobby',
      },
    };

    // Use game engine to advance state
    const seed = Date.now();
    const newState = advanceGameState(engineState, [enrichedAction as EnginePlayerAction], seed);

    // Check for new votes and emit events
    const previousVotesCount = game.votes.length;
    const newVotes = newState.votes || [];

    // Merge engine state back into game
    game.proposals = newState.proposals || [];
    game.votes = newVotes;
    game.debates = newState.debates || [];
    game.speeches = newState.speeches || [];
    game.updatedAt = newState.updatedAt;

    if (newState.economy) {
      game.economy = newState.economy;
    }

    if (newState.turn) {
      game.currentTurn = newState.turn.turnNumber;
      // Map engine phase back to our phase system
      game.phase = reversePhaseMapping[newState.turn.phase] || game.phase;
    }

    // Emit events for new votes
    if (newVotes.length > previousVotesCount) {
      const newVote = newVotes[newVotes.length - 1];
      if (newVote && enrichedAction.type === 'vote') {
        gameEventEmitter.emitParliamentVote(
          gameId,
          newVote.proposalId,
          newVote.playerId,
          newVote.choice
        );
      }
    }

    // Check for newly enacted proposals and emit events
    const previousProposals = engineState.proposals || [];
    const currentProposals = newState.proposals || [];
    const prevById = new Map(previousProposals.map(p => [p.id, p]));

    currentProposals.forEach(currProposal => {
      if (!currProposal) return;
      const prevProposal = prevById.get(currProposal.id);
      const isNewlyEnacted =
        currProposal.status === 'enacted' && (!prevProposal || prevProposal.status !== 'enacted');
      if (isNewlyEnacted) {
        gameEventEmitter.emitParliamentBillPassed(gameId, currProposal.id);
      }
    });

    // Persist updated game state
    await this.updateGameState(gameId, game);

    return game;
  }

  /**
   * Start a game (move from lobby to active)
   */
  async startGame(gameId: string, playerId: string): Promise<GameState> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Verify player is creator (first player)
    if (!game.players[0] || game.players[0].id !== playerId) {
      throw new Error('Only game creator can start the game');
    }

    if (game.status !== 'waiting') {
      throw new Error('Game already started');
    }

    if (game.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    game.status = 'active';
    game.phase = 'legislative';

    await this.updateGameState(gameId, game);

    return game;
  }

  /**
   * Advance game to next phase
   */
  async advancePhase(gameId: string, playerId: string): Promise<GameState> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'active' || game.phase === 'finished') {
      throw new Error('Game is not active');
    }

    // Check if player is in game
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not in this game');
    }

    // Phase progression logic
    const phaseOrder: GameState['phase'][] = [
      'setup',
      'legislative',
      'executive',
      'judicial',
      'media',
      'election',
      'finished',
    ];
    const currentIndex = phaseOrder.indexOf(game.phase);

    if (currentIndex === -1) {
      throw new Error('Invalid game phase');
    }

    // Check if current phase requirements are met before advancing
    if (!this.canAdvancePhase(game)) {
      throw new Error('Cannot advance phase: requirements not met');
    }

    const previousPhase = game.phase;

    // Advance to next phase
    const nextIndex = currentIndex + 1;
    if (nextIndex >= phaseOrder.length) {
      game.phase = 'finished';
      game.status = 'finished';
    } else {
      game.phase = phaseOrder[nextIndex] as GameState['phase'];
    }

    // Execute phase transition logic
    this.executePhaseTransition(game);

    game.updatedAt = new Date().toISOString();

    // Emit phase change event
    gameEventEmitter.emitGamePhaseChanged(gameId, game.phase, previousPhase);

    // Persist updated game state
    await this.updateGameState(gameId, game);

    return game;
  }

  /**
   * Check if game can advance to next phase
   */
  private canAdvancePhase(game: GameState): boolean {
    switch (game.phase) {
      case 'setup':
        return game.parliamentState.chambersCreated;
      case 'legislative':
        return game.parliamentState.passedLaws.length > 0;
      case 'executive':
        return game.governmentState.executiveActions.length > 0;
      case 'judicial':
        return game.judiciaryState.rulings.length >= 0; // Always allow after executive
      case 'media':
        return game.mediaState.pressReleases.length > 0;
      case 'election':
        return game.electionState.electionTriggered;
      default:
        return true;
    }
  }

  /**
   * Execute phase transition logic
   */
  private executePhaseTransition(game: GameState): void {
    switch (game.phase) {
      case 'legislative':
        this.initializeParliament(game);
        break;
      case 'executive':
        this.initializeGovernment(game);
        break;
      case 'judicial':
        this.initializeJudiciary(game);
        break;
      case 'media':
        this.initializeMedia(game);
        break;
      case 'election':
        this.initializeElection(game);
        break;
      case 'finished':
        this.calculateFinalScore(game);
        break;
    }
  }

  /**
   * Initialize parliament for legislative phase
   */
  private initializeParliament(game: GameState): void {
    // This would create chambers via parliament service
    game.parliamentState.chambersCreated = true;
  }

  /**
   * Initialize government for executive phase
   */
  private initializeGovernment(game: GameState): void {
    // Create government
    game.governmentState.governmentId = `gov-${game.id}`;

    // Convert passed laws into executive actions
    game.governmentState.executiveActions = game.parliamentState.passedLaws.map(
      lawId => `exec-${lawId}`
    );

    // Assign ministers from players
    game.governmentState.ministers = game.players
      .filter(p => p.role === 'mp') // MPs can become ministers
      .slice(0, 3) // Limit to 3 ministers for simplicity
      .map(p => ({
        userId: p.id,
        portfolio:
          ['Finance', 'Health', 'Education'][game.governmentState.ministers.length] || 'General',
      }));

    // Emit government formed event
    gameEventEmitter.emitGameEvent({
      type: 'government-formed',
      gameId: game.id,
      data: {
        governmentId: game.governmentState.governmentId,
        ministers: game.governmentState.ministers,
      },
      timestamp: Date.now(),
    });

    // Emit executive actions
    game.governmentState.executiveActions.forEach(actionId => {
      gameEventEmitter.emitGovernmentAction(game.id, actionId, 'system', 'policy');
    });
  }

  /**
   * Initialize judiciary for judicial phase
   */
  private initializeJudiciary(game: GameState): void {
    // Assign judges from players
    game.judiciaryState.judges = game.players
      .filter(p => p.role === 'mp') // MPs can become judges
      .slice(0, 2) // Limit to 2 judges
      .map(p => p.id);

    // Create cases challenging executive actions (simulate judicial review)
    const challengedActions = game.governmentState.executiveActions.slice(0, 1); // Challenge first action
    game.judiciaryState.activeCases = challengedActions.map(actionId => `case-${actionId}`);

    // Simulate rulings (some pass, some fail)
    game.judiciaryState.rulings = game.judiciaryState.activeCases.map(caseId => `ruling-${caseId}`);

    // Emit judicial rulings
    game.judiciaryState.rulings.forEach(rulingId => {
      gameEventEmitter.emitJudicialRuling(game.id, `case-${rulingId}`, rulingId, 'upheld');
    });
  }

  /**
   * Initialize media for media phase
   */
  private initializeMedia(game: GameState): void {
    // Generate press releases based on judicial rulings
    game.mediaState.pressReleases = game.judiciaryState.rulings.map(
      rulingId => `press-${rulingId}`
    );

    // Create polls based on government performance
    game.mediaState.polls = [`poll-gov-approval`, `poll-trust-judiciary`];

    // Update public opinion based on rulings and government actions
    const rulingCount = game.judiciaryState.rulings.length;
    const executiveActions = game.governmentState.executiveActions.length;

    // Judicial rulings can affect trust
    game.mediaState.publicOpinion.trust = Math.min(100, 50 + rulingCount * 5);

    // Government actions and rulings affect approval
    game.mediaState.publicOpinion.approval = Math.min(
      100,
      50 + executiveActions * 3 - rulingCount * 2
    );

    // Emit media press releases
    game.mediaState.pressReleases.forEach(releaseId => {
      gameEventEmitter.emitMediaPressRelease(game.id, releaseId, `Press Release: ${releaseId}`);
    });
  }

  /**
   * Initialize election for election phase
   */
  private initializeElection(game: GameState): void {
    game.electionState.electionTriggered = true;
    game.electionState.nextElectionDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Election outcome based on public opinion
    const approval = game.mediaState.publicOpinion.approval;
    const _trust = game.mediaState.publicOpinion.trust;

    // Government approval affects re-election chances
    game.electionState.currentGovernmentApproval = approval;

    // If approval is low, trigger early election or government change
    if (approval < 40) {
      // Government loses confidence, new election called
      game.electionState.electionTriggered = true;
    } else if (approval > 70) {
      // Government maintains strong position
      game.electionState.electionTriggered = false; // Could continue
    }

    // Emit election results
    gameEventEmitter.emitElectionResults(game.id, {
      approval,
      triggered: game.electionState.electionTriggered,
      nextElectionDate: game.electionState.nextElectionDate,
    });
  }

  /**
   * Calculate final game score
   */
  private calculateFinalScore(game: GameState): void {
    // Calculate win conditions
    game.winConditions.stability = Math.min(100, game.mediaState.publicOpinion.approval);
    game.winConditions.legislation = game.parliamentState.passedLaws.length * 10;
    game.winConditions.publicTrust = game.mediaState.publicOpinion.trust;

    // Determine winner based on scores
    const totalScore =
      game.winConditions.stability +
      game.winConditions.legislation +
      game.winConditions.publicTrust;
    if (totalScore >= 150) {
      // Game succeeded
    } else {
      // Game could be improved
    }
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: string, playerId: string): Promise<void> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Only creator can delete
    if (!game.players[0] || game.players[0].id !== playerId) {
      throw new Error('Only game creator can delete the game');
    }

    // Delete from database
    await prisma.game.delete({
      where: { id: gameId },
    });
  }

  public localModeration(content: string | null): { isSafe: boolean; reasons: string[] } {
    if (!content) {
      return { isSafe: true, reasons: [] };
    }

    const text = content.toLowerCase();
    const reasons: string[] = [];

    if (text.includes('hate') || text.includes('kill')) {
      reasons.push('Potential hate/violence');
    }
    if (text.includes('child') && (text.includes('porn') || text.includes('abuse'))) {
      reasons.push('Child safety');
    }
    if (/(fuck|shit|bullshit)/.test(text)) {
      reasons.push('Profanity');
    }

    return { isSafe: reasons.length === 0, reasons };
  }

  public async remoteModeration(
    content: string,
    userId: string = 'system'
  ): Promise<{ isSafe: boolean; reasons: string[] } | null> {
    if (!process.env.API_MODERATION_URL) {
      return null;
    }

    const fetchPromise = fetch(process.env.API_MODERATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId }),
    });

    // Prevent unhandled rejection when racing promise
    fetchPromise.catch(() => null);

    try {
      const response = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Moderation timeout')), 3000)),
      ]);

      const res = response as Response;

      if (!res?.ok) {
        await this.recordAuditLog({
          category: 'content_moderation',
          action: 'moderation_api_failure',
          userId,
          resource: 'content',
          details: { reason: 'non_ok_response' },
        });
        return null;
      }

      const payload = await res.json().catch(() => null);
      const moderation = payload?.data;

      if (!payload?.success || typeof moderation?.isSafe !== 'boolean') {
        await this.recordAuditLog({
          category: 'content_moderation',
          action: 'moderation_api_failure',
          userId,
          resource: 'content',
          details: { reason: 'invalid_response' },
        });
        return null;
      }

      await this.recordAuditLog({
        category: 'content_moderation',
        action: 'moderation_checked',
        userId,
        resource: 'content',
        details: { isSafe: moderation.isSafe, reasons: moderation.reasons || [] },
      });

      compliance.logComplianceEvent({
        category: 'content_moderation',
        action: 'moderation_checked',
        userId,
        resource: 'content',
        details: { isSafe: moderation.isSafe, reasons: moderation.reasons || [] },
        complianceFrameworks: ['DSA'],
      });

      return { isSafe: moderation.isSafe, reasons: moderation.reasons || [] };
    } catch (error) {
      loggerError('Remote moderation failed', { error: (error as Error).message, userId });
      await this.recordAuditLog({
        category: 'content_moderation',
        action: 'moderation_api_failure',
        userId,
        resource: 'content',
        details: { reason: 'exception' },
      });
      compliance.logComplianceEvent({
        category: 'content_moderation',
        action: 'moderation_api_failure',
        userId,
        resource: 'content',
        details: { error: (error as Error).message },
        complianceFrameworks: ['DSA'],
      });
      return null;
    }
  }

  public async checkAgeVerification(
    userId: string
  ): Promise<{ verified: boolean; age: number | null }> {
    if (!process.env.API_BASE_URL) {
      return { verified: false, age: null };
    }

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/api/age/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      });

      if (!response.ok) {
        return { verified: false, age: null };
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.success || !payload.data?.verified) {
        return { verified: false, age: null };
      }

      return {
        verified: true,
        age: typeof payload.data.age === 'number' ? payload.data.age : null,
      };
    } catch (error) {
      loggerError('Age verification API failed', { error: (error as Error).message, userId });
      return { verified: false, age: null };
    }
  }

  public async checkContentAccess(userId: string, rating: string): Promise<boolean> {
    if (!process.env.API_BASE_URL) {
      return false;
    }

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/api/age/check-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({ contentRating: rating }),
      });

      if (!response.ok) {
        return false;
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.success) {
        return false;
      }

      return Boolean(payload.data?.canAccess);
    } catch (error) {
      loggerError('Content access check failed', { error: (error as Error).message, userId });
      return false;
    }
  }

  /**
   * Get flagged proposals for a game (moderator view)
   */
  async getFlaggedProposals(gameId: string): Promise<unknown[]> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Return proposals that are flagged
    return (game.proposals || []).filter(
      p => p.status === 'flagged' || p.moderationStatus === 'flagged'
    );
  }

  /**
   * Review and moderate a flagged proposal
   */
  async reviewFlaggedProposal(
    gameId: string,
    proposalId: string,
    moderatorId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<unknown> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const proposal = (game.proposals || []).find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'flagged' && proposal.moderationStatus !== 'flagged') {
      throw new Error('Proposal is not flagged for review');
    }

    if (action === 'approve') {
      proposal.status = 'voting';
      proposal.moderationStatus = 'approved';
      proposal.reviewedAt = new Date().toISOString();
      proposal.reviewedBy = moderatorId;
      proposal.reviewNote = note || null;
    } else if (action === 'reject') {
      proposal.status = 'rejected';
      proposal.moderationStatus = 'rejected';
      proposal.reviewedAt = new Date().toISOString();
      proposal.reviewedBy = moderatorId;
      proposal.reviewNote = note || null;
    } else {
      throw new Error('Invalid action - must be "approve" or "reject"');
    }

    game.updatedAt = new Date().toISOString();

    // Update game in database
    await this.updateGameState(gameId, game);

    // Log moderation action
    compliance.logComplianceEvent({
      category: 'content_moderation',
      action: action === 'approve' ? 'proposal_approved' : 'proposal_rejected',
      userId: moderatorId,
      resource: 'game_proposal',
      details: {
        gameId,
        proposalId,
        flaggedReasons: proposal.flaggedReasons || [],
        note: note || null,
      },
      complianceFrameworks: ['DSA'],
    });

    await this.recordAuditLog({
      category: 'content_moderation',
      action: action === 'approve' ? 'proposal_approved' : 'proposal_rejected',
      userId: moderatorId,
      resource: 'game_proposal',
      details: { gameId, proposalId, note: note || null },
    });

    return proposal;
  }
}

/**
 * Shared `gameService` singleton used by the API to handle game lifecycle
 * operations. Tests should instantiate `GameService` directly when they
 * require isolated state.
 */
export const gameService = new GameService();
