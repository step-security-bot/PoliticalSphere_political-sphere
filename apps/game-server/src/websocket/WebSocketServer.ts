/**
 * WebSocket Server for Real-Time Game Updates
 *
 * Provides real-time bidirectional communication between the game server
 * and connected clients for live game state updates, player actions, and events.
 *
 * @module websocket/WebSocketServer
 */

import {
  createLogger,
  initializeJWTFromEnv,
  verifyAuthHeader,
  type VerificationResult,
} from '@political-sphere/shared';
import type { Server as HttpServer } from 'node:http';
import { WebSocketServer as WSServer, type WebSocket } from 'ws';

interface GameClient {
  id: string;
  socket: WebSocket;
  gameId: string;
  userId: string | undefined;
  username: string | undefined;
  authenticated: boolean;
  lastPing: number;
  messageCount: number;
  lastMessageTime: number;
}

interface GameMessage {
  type: string;
  gameId?: string;
  data?: unknown;
  timestamp?: number;
}

/**
 * Valid message types
 */
const VALID_MESSAGE_TYPES = ['join', 'leave', 'action', 'ping'] as const;
type ValidMessageType = (typeof VALID_MESSAGE_TYPES)[number];

/**
 * Validate message structure
 */
function isValidMessage(msg: unknown): msg is GameMessage {
  if (!msg || typeof msg !== 'object') {
    return false;
  }

  const message = msg as Record<string, unknown>;

  // Type must be a non-empty string
  if (typeof message.type !== 'string' || message.type.trim() === '') {
    return false;
  }

  // Type must be in valid list
  if (!VALID_MESSAGE_TYPES.includes(message.type as ValidMessageType)) {
    return false;
  }

  // GameId must be string if present
  if (message.gameId !== undefined && typeof message.gameId !== 'string') {
    return false;
  }

  return true;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<string, GameClient> = new Map();
  private gameRooms: Map<string, Set<string>> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL_MS = 30000;
  private readonly CLIENT_TIMEOUT_MS = 60000;
  private readonly MAX_MESSAGES_PER_MINUTE = 60;
  private readonly MESSAGE_WINDOW_MS = 60000;
  private readonly authRequired: boolean;
  private readonly allowedOrigins: string[];

  constructor(server: HttpServer, options?: { requireAuth?: boolean; allowedOrigins?: string[] }) {
    this.logger = createLogger({ service: 'websocket-server' });
    this.authRequired = options?.requireAuth ?? true;

    // Parse allowed origins from environment variable or options
    this.allowedOrigins = options?.allowedOrigins || this.parseAllowedOrigins();

    this.logger.info('WebSocket server configuration', {
      authRequired: this.authRequired,
      allowedOrigins: this.allowedOrigins,
    });

    // Initialize JWT if authentication is required
    if (this.authRequired) {
      try {
        initializeJWTFromEnv();
        this.logger.info('JWT authentication initialized for WebSocket server');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error('Failed to initialize JWT authentication', { error: message });
        throw new Error(`WebSocket authentication setup failed: ${message}`);
      }
    }

    this.wss = new WSServer({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupEventHandlers();
    this.startPingInterval();

    this.logger.info('WebSocket server initialized', {
      path: '/ws',
      pingInterval: this.PING_INTERVAL_MS,
    });
  }

  /**
   * Parse allowed origins from environment variable
   */
  private parseAllowedOrigins(): string[] {
    const envOrigins = process.env.WS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';

    if (!envOrigins || envOrigins.trim() === '') {
      // Default to localhost for development
      this.logger.warn('No allowed origins configured, defaulting to localhost', {
        env: 'WS_ALLOWED_ORIGINS or CORS_ORIGIN not set',
      });
      return ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5100'];
    }

    // Parse comma-separated list, trim whitespace
    const origins = envOrigins
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);

    if (origins.length === 0) {
      this.logger.warn('Empty allowed origins list after parsing', {
        rawValue: envOrigins,
      });
      return ['http://localhost:3000'];
    }

    return origins;
  }

  /**
   * Verify client connection (origin validation, authentication, rate limiting)
   */
  private verifyClient(
    info: { origin: string; req: { headers: Record<string, string | string[] | undefined> } },
    callback: (verified: boolean, code?: number, message?: string) => void
  ): void {
    const origin = info.origin || 'unknown';

    // Origin validation
    if (this.allowedOrigins.length > 0 && !this.allowedOrigins.includes(origin)) {
      this.logger.warn('Client connection rejected - origin not allowed', {
        origin,
        allowedOrigins: this.allowedOrigins,
      });
      callback(false, 403, 'Origin not allowed');
      return;
    }

    // Skip authentication if not required (development mode)
    if (!this.authRequired) {
      this.logger.debug('Client connection accepted (auth disabled)', { origin });
      callback(true);
      return;
    }

    // Extract and verify JWT token
    const authHeader = info.req.headers.authorization;
    const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    const result: VerificationResult = verifyAuthHeader(authHeaderStr);

    if (!result.valid) {
      this.logger.warn('Client connection rejected - authentication failed', {
        origin,
        error: result.error,
      });
      callback(false, 401, result.error || 'Authentication required');
      return;
    }

    this.logger.debug('Client connection verified', {
      origin,
      userId: result.payload?.userId,
      username: result.payload?.username,
    });

    callback(true);
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.wss.on('connection', (socket: WebSocket, req) => {
      const clientId = this.generateClientId();

      // Extract user info from token if authentication is enabled
      let userId: string | undefined;
      let username: string | undefined;
      let authenticated = false;

      if (this.authRequired) {
        const authHeader = req.headers.authorization;
        const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
        const result: VerificationResult = verifyAuthHeader(authHeaderStr);

        if (result.valid && result.payload) {
          userId = result.payload.userId;
          username = result.payload.username;
          authenticated = true;
        }
      }

      const client: GameClient = {
        id: clientId,
        socket,
        gameId: '',
        userId,
        username,
        authenticated,
        lastPing: Date.now(),
        messageCount: 0,
        lastMessageTime: Date.now(),
      };

      this.clients.set(clientId, client);

      this.logger.info('Client connected', {
        clientId,
        userId,
        username,
        authenticated,
        ip: req.socket.remoteAddress,
        totalClients: this.clients.size,
      });

      socket.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      socket.on('close', () => {
        this.handleDisconnect(clientId);
      });

      socket.on('error', (error: Error) => {
        this.logger.error('WebSocket error', {
          clientId,
          error: error.message,
        });
      });

      socket.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
        }
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        data: { clientId },
        timestamp: Date.now(),
      });
    });

    this.wss.on('error', (error: Error) => {
      this.logger.error('WebSocket server error', {
        error: error.message,
        stack: error.stack,
      });
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn('Message from unknown client', { clientId });
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastMessage = now - client.lastMessageTime;

    // Reset counter if outside the window
    if (timeSinceLastMessage > this.MESSAGE_WINDOW_MS) {
      client.messageCount = 0;
      client.lastMessageTime = now;
    }

    // Increment message count
    client.messageCount++;

    // Check if rate limit exceeded
    if (client.messageCount > this.MAX_MESSAGES_PER_MINUTE) {
      this.logger.warn('Rate limit exceeded', {
        clientId,
        userId: client.userId,
        messageCount: client.messageCount,
        window: this.MESSAGE_WINDOW_MS,
      });

      this.sendToClient(clientId, {
        type: 'error',
        data: {
          message: 'Rate limit exceeded. Please slow down.',
          retryAfter: Math.ceil((client.lastMessageTime + this.MESSAGE_WINDOW_MS - now) / 1000),
        },
      });
      return;
    }

    // Message size validation (max 10KB)
    const MAX_MESSAGE_SIZE = 10 * 1024; // 10KB
    if (data.length > MAX_MESSAGE_SIZE) {
      this.logger.warn('Message too large', {
        clientId,
        userId: client.userId,
        size: data.length,
        maxSize: MAX_MESSAGE_SIZE,
      });
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Message too large. Maximum size is 10KB.' },
      });
      return;
    }

    try {
      const message = JSON.parse(data.toString()) as GameMessage;

      // Validate message structure
      if (!isValidMessage(message)) {
        this.logger.warn('Invalid message structure', {
          clientId,
          userId: client.userId,
          messageType:
            typeof message === 'object' ? (message as Record<string, unknown>).type : 'unknown',
        });
        this.sendToClient(clientId, {
          type: 'error',
          data: {
            message: 'Invalid message format. Message must have a valid type and structure.',
            allowedTypes: VALID_MESSAGE_TYPES,
          },
        });
        return;
      }

      // Validate gameId format if present (UUID v4 pattern)
      if (message.gameId !== undefined && message.gameId.trim() !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(message.gameId)) {
          this.logger.warn('Invalid gameId format', {
            clientId,
            userId: client.userId,
            gameId: message.gameId,
          });
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid gameId format. Must be a valid UUID.' },
          });
          return;
        }
      }

      this.logger.debug('Received message', {
        clientId,
        userId: client.userId,
        type: message.type,
        gameId: message.gameId,
      });

      switch (message.type) {
        case 'join':
          this.handleJoinGame(clientId, message);
          break;
        case 'leave':
          this.handleLeaveGame(clientId);
          break;
        case 'action':
          this.handleGameAction(clientId, message);
          break;
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          // Type narrowing ensures this is unreachable
          this.logger.warn('Unknown message type', {
            clientId,
            type: message.type,
          });
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: `Unknown message type: ${message.type}` },
          });
      }
    } catch (error) {
      this.logger.error('Error parsing message', {
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Invalid message format' },
      });
    }
  }

  /**
   * Handle client joining a game room
   */
  private handleJoinGame(clientId: string, message: GameMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !message.gameId) {
      return;
    }

    // Leave current game if in one
    if (client.gameId) {
      this.handleLeaveGame(clientId);
    }

    client.gameId = message.gameId;

    // Add to game room
    if (!this.gameRooms.has(message.gameId)) {
      this.gameRooms.set(message.gameId, new Set());
    }
    const room = this.gameRooms.get(message.gameId);
    if (room) {
      room.add(clientId);
    }

    this.logger.info('Client joined game', {
      clientId,
      gameId: message.gameId,
      roomSize: room?.size || 0,
    });

    this.sendToClient(clientId, {
      type: 'joined',
      gameId: message.gameId,
      timestamp: Date.now(),
    });

    // Notify others in the room
    this.broadcastToGame(
      message.gameId,
      {
        type: 'player-joined',
        data: { clientId },
        timestamp: Date.now(),
      },
      clientId
    );
  }

  /**
   * Handle client leaving a game room
   */
  private handleLeaveGame(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client || !client.gameId) {
      return;
    }

    const gameId = client.gameId;
    const room = this.gameRooms.get(gameId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.gameRooms.delete(gameId);
      }
    }

    this.logger.info('Client left game', {
      clientId,
      gameId,
      remainingPlayers: room?.size || 0,
    });

    // Notify others in the room
    this.broadcastToGame(
      gameId,
      {
        type: 'player-left',
        data: { clientId },
        timestamp: Date.now(),
      },
      clientId
    );

    client.gameId = '';
  }

  /**
   * Handle game action from client
   */
  private handleGameAction(clientId: string, message: GameMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.gameId) {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Not in a game' },
      });
      return;
    }

    this.logger.info('Game action', {
      clientId,
      gameId: client.gameId,
      actionType: message.type,
    });

    // TODO: Process game action through game engine
    // For now, just broadcast to other players
    this.broadcastToGame(
      client.gameId,
      {
        type: 'game-update',
        gameId: client.gameId,
        data: message.data,
        timestamp: Date.now(),
      },
      clientId
    );
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Leave game room
    if (client.gameId) {
      this.handleLeaveGame(clientId);
    }

    this.clients.delete(clientId);

    this.logger.info('Client disconnected', {
      clientId,
      totalClients: this.clients.size,
    });
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: GameMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== client.socket.OPEN) {
      return;
    }

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      this.logger.error('Error sending message to client', {
        clientId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Broadcast message to all clients in a game
   */
  public broadcastToGame(gameId: string, message: GameMessage, excludeClientId?: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return;
    }

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: GameMessage): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Start ping interval to detect dead connections
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        // Remove dead connections
        if (now - client.lastPing > this.CLIENT_TIMEOUT_MS) {
          this.logger.warn('Client timeout', { clientId });
          client.socket.terminate();
          this.handleDisconnect(clientId);
          continue;
        }

        // Ping active connections
        if (client.socket.readyState === client.socket.OPEN) {
          client.socket.ping();
        }
      }
    }, this.PING_INTERVAL_MS);
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Get statistics about connected clients
   */
  public getStats(): {
    totalClients: number;
    activeGames: number;
    rooms: Record<string, number>;
  } {
    const rooms: Record<string, number> = {};
    for (const [gameId, clients] of this.gameRooms.entries()) {
      rooms[gameId] = clients.size;
    }

    return {
      totalClients: this.clients.size,
      activeGames: this.gameRooms.size,
      rooms,
    };
  }

  /**
   * Close the WebSocket server (alias for shutdown for test compatibility)
   */
  public close(): void {
    this.shutdown().catch(error => {
      this.logger.error('Error during WebSocket server close', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down WebSocket server');

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close(1000, 'Server shutting down');
    }

    return new Promise<void>(resolve => {
      this.wss.close(() => {
        this.logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}
