/**
 * Basic event handling system for game server
 * Manages game events, user actions, and system notifications
 */

export interface GameEvent {
  type: string;
  playerId?: string;
  gameId?: string;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: GameEvent) => void | Promise<void>;

export class EventManager {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler for a specific event type
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: GameEvent): Promise<void> {
    event.timestamp = event.timestamp || new Date();
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(handlers.map(handler => handler(event)));
    }
  }

  /**
   * Emit a game action event
   */
  async emitGameAction(
    playerId: string,
    gameId: string,
    action: string,
    data: any = {},
  ): Promise<void> {
    await this.emit({
      type: 'game:action',
      playerId,
      gameId,
      data: { action, ...data },
      timestamp: new Date(),
    });
  }

  /**
   * Emit a player join event
   */
  async emitPlayerJoin(playerId: string, gameId: string): Promise<void> {
    await this.emit({
      type: 'player:join',
      playerId,
      gameId,
      data: {},
      timestamp: new Date(),
    });
  }

  /**
   * Emit a player leave event
   */
  async emitPlayerLeave(playerId: string, gameId: string): Promise<void> {
    await this.emit({
      type: 'player:leave',
      playerId,
      gameId,
      data: {},
      timestamp: new Date(),
    });
  }
}

export const eventManager = new EventManager();
