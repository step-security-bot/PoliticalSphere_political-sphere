/**
 * Performance Monitoring Utilities
 * Provides metrics and tracing for critical game server operations
 */

import { trace, SpanStatusCode } from '@political-sphere/shared';
import type { Span } from '@opentelemetry/api';

const tracer = trace.getTracer('game-server', '0.0.0');

/**
 * Performance metrics for monitoring operation timings
 */
export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Wrap an async operation with performance tracking and distributed tracing
 *
 * @param operationName - Name of the operation being tracked
 * @param operation - Async function to execute
 * @param attributes - Additional attributes to attach to the span
 * @returns Result of the operation
 *
 * @example
 * ```typescript
 * const game = await trackPerformance(
 *   'game.create',
 *   async () => createNewGame(id),
 *   { gameId: id }
 * );
 * ```
 */
export async function trackPerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  const span: Span = tracer.startSpan(operationName, {
    attributes: {
      'operation.name': operationName,
      ...attributes,
    },
  });

  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('operation.duration_ms', duration);
    span.setAttribute('operation.success', true);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: errorMessage,
    });
    span.setAttribute('operation.duration_ms', duration);
    span.setAttribute('operation.success', false);
    span.setAttribute('operation.error', errorMessage);

    throw error;
  } finally {
    span.end();
  }
}

/**
 * Track synchronous operation performance
 *
 * @param operationName - Name of the operation being tracked
 * @param operation - Synchronous function to execute
 * @param attributes - Additional attributes to attach to the span
 * @returns Result of the operation
 *
 * @example
 * ```typescript
 * const validated = trackSyncPerformance(
 *   'input.validate',
 *   () => validateProposal(data),
 *   { proposalId: data.id }
 * );
 * ```
 */
export function trackSyncPerformance<T>(
  operationName: string,
  operation: () => T,
  attributes: Record<string, string | number | boolean> = {}
): T {
  const span: Span = tracer.startSpan(operationName, {
    attributes: {
      'operation.name': operationName,
      ...attributes,
    },
  });

  const startTime = performance.now();

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('operation.duration_ms', duration);
    span.setAttribute('operation.success', true);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: errorMessage,
    });
    span.setAttribute('operation.duration_ms', duration);
    span.setAttribute('operation.success', false);
    span.setAttribute('operation.error', errorMessage);

    throw error;
  } finally {
    span.end();
  }
}

/**
 * Create a manual span for complex operations that need fine-grained control
 *
 * @param operationName - Name of the operation
 * @param attributes - Initial attributes for the span
 * @returns Span object for manual management
 *
 * @example
 * ```typescript
 * const span = createSpan('game.process_turn', { gameId: 'game-123' });
 * try {
 *   // Complex multi-step operation
 *   span.addEvent('validation_complete');
 *   // More steps...
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
 *   throw error;
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function createSpan(
  operationName: string,
  attributes: Record<string, string | number | boolean> = {}
): Span {
  return tracer.startSpan(operationName, {
    attributes: {
      'operation.name': operationName,
      ...attributes,
    },
  });
}

/**
 * Performance monitoring for game state operations
 */
export const GamePerformance = {
  /**
   * Track game creation performance
   */
  async trackGameCreation<T>(gameId: string, operation: () => Promise<T>): Promise<T> {
    return trackPerformance('game.create', operation, { gameId });
  },

  /**
   * Track game state update performance
   */
  async trackGameUpdate<T>(
    gameId: string,
    actionType: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return trackPerformance('game.update', operation, {
      gameId,
      actionType,
    });
  },

  /**
   * Track proposal submission performance
   */
  async trackProposalSubmit<T>(
    gameId: string,
    proposalId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return trackPerformance('game.proposal.submit', operation, {
      gameId,
      proposalId,
    });
  },

  /**
   * Track vote casting performance
   */
  async trackVoteCast<T>(
    gameId: string,
    proposalId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return trackPerformance('game.vote.cast', operation, {
      gameId,
      proposalId,
    });
  },

  /**
   * Track moderation check performance
   */
  async trackModerationCheck<T>(contentType: string, operation: () => Promise<T>): Promise<T> {
    return trackPerformance('moderation.check', operation, {
      contentType,
    });
  },

  /**
   * Track database operation performance
   */
  async trackDatabaseOp<T>(operationType: string, operation: () => Promise<T>): Promise<T> {
    return trackPerformance('database.operation', operation, {
      operationType,
    });
  },
};

/**
 * Performance monitoring for WebSocket operations
 */
export const WebSocketPerformance = {
  /**
   * Track message processing performance
   */
  async trackMessageProcess<T>(messageType: string, operation: () => Promise<T>): Promise<T> {
    return trackPerformance('websocket.message.process', operation, {
      messageType,
    });
  },

  /**
   * Track broadcast performance
   */
  trackBroadcast(gameId: string, recipientCount: number, operation: () => void): void {
    trackSyncPerformance('websocket.broadcast', operation, {
      gameId,
      recipientCount,
    });
  },

  /**
   * Track authentication performance
   */
  async trackAuthentication<T>(operation: () => Promise<T>): Promise<T> {
    return trackPerformance('websocket.authentication', operation);
  },
};
