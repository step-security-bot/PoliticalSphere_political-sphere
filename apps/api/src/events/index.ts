/**
 * Event system for real-time notifications
 * Integrates with WebSocket server to broadcast events to connected clients
 */

import { EventEmitter } from 'node:events';
import type { WebSocketServer } from '../websocket/WebSocketServer';

export interface GameEvent {
  type: string;
  gameId?: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// Event types for different game activities
export const EVENT_TYPES = {
  // Parliament events
  PARLIAMENT_VOTE: 'parliament-vote',
  PARLIAMENT_BILL_PASSED: 'parliament-bill-passed',
  PARLIAMENT_BILL_REJECTED: 'parliament-bill-rejected',

  // Government events
  GOVERNMENT_ACTION: 'government-action',
  GOVERNMENT_FORMED: 'government-formed',
  MINISTER_APPOINTED: 'minister-appointed',

  // Judiciary events
  JUDICIAL_RULING: 'judicial-ruling',
  CASE_FILED: 'case-filed',

  // Media events
  MEDIA_PRESS_RELEASE: 'media-press-release',
  MEDIA_POLL_CREATED: 'media-poll-created',
  MEDIA_POLL_VOTED: 'media-poll-voted',

  // Election events
  ELECTION_STARTED: 'election-started',
  ELECTION_ENDED: 'election-ended',
  ELECTION_RESULTS: 'election-results',

  // Game phase events
  GAME_PHASE_CHANGED: 'game-phase-changed',
  GAME_TURN_ADVANCED: 'game-turn-advanced',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

class GameEventEmitter extends EventEmitter {
  private wsServer: WebSocketServer | null = null;

  setWebSocketServer(wsServer: WebSocketServer): void {
    this.wsServer = wsServer;
  }

  emitGameEvent(event: GameEvent): void {
    // Emit to local listeners
    this.emit(event.type, event);

    // Broadcast to WebSocket clients
    if (this.wsServer) {
      if (event.gameId) {
        // Broadcast to specific game room
        this.wsServer.broadcastToGame(event.gameId, {
          type: event.type,
          gameId: event.gameId,
          data: event.data,
          timestamp: event.timestamp,
        });
      } else {
        // Broadcast to all clients
        this.wsServer.broadcast({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      }
    }
  }

  // Convenience methods for specific event types
  emitParliamentVote(
    gameId: string,
    billId: string,
    voterId: string,
    choice: 'for' | 'against' | 'abstain'
  ): void {
    this.emitGameEvent({
      type: EVENT_TYPES.PARLIAMENT_VOTE,
      gameId,
      data: { billId, voterId, choice },
      timestamp: Date.now(),
    });
  }

  emitParliamentBillPassed(gameId: string, billId: string): void {
    this.emitGameEvent({
      type: EVENT_TYPES.PARLIAMENT_BILL_PASSED,
      gameId,
      data: { billId },
      timestamp: Date.now(),
    });
  }

  emitGovernmentAction(gameId: string, actionId: string, ministerId: string, type: string): void {
    this.emitGameEvent({
      type: EVENT_TYPES.GOVERNMENT_ACTION,
      gameId,
      data: { actionId, ministerId, type },
      timestamp: Date.now(),
    });
  }

  emitJudicialRuling(gameId: string, caseId: string, rulingId: string, decision: string): void {
    this.emitGameEvent({
      type: EVENT_TYPES.JUDICIAL_RULING,
      gameId,
      data: { caseId, rulingId, decision },
      timestamp: Date.now(),
    });
  }

  emitMediaPressRelease(gameId: string, releaseId: string, title: string): void {
    this.emitGameEvent({
      type: EVENT_TYPES.MEDIA_PRESS_RELEASE,
      gameId,
      data: { releaseId, title },
      timestamp: Date.now(),
    });
  }

  emitElectionResults(gameId: string, results: Record<string, unknown>): void {
    this.emitGameEvent({
      type: EVENT_TYPES.ELECTION_RESULTS,
      gameId,
      data: { results },
      timestamp: Date.now(),
    });
  }

  emitGamePhaseChanged(gameId: string, phase: string, previousPhase: string): void {
    this.emitGameEvent({
      type: EVENT_TYPES.GAME_PHASE_CHANGED,
      gameId,
      data: { phase, previousPhase },
      timestamp: Date.now(),
    });
  }
}

// Global event emitter instance
export const gameEventEmitter = new GameEventEmitter();
