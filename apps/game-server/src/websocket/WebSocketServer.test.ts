/**
 * WebSocket Server Integration Tests
 * Tests authentication, rate limiting, input validation, and message broadcasting
 */

import { initializeJWT } from '@political-sphere/shared';
import type { Server as HTTPServer } from 'http';
import { createServer } from 'http';
import { sign } from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { WebSocketServer } from './WebSocketServer';

const TEST_JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
const TEST_JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-characters-long-different';
const TEST_PORT = 3100;

describe('WebSocketServer', () => {
  let httpServer: HTTPServer;
  let wsServer: WebSocketServer;
  let baseUrl: string;

  beforeEach(() => {
    // Set up test environment variables
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_JWT_REFRESH_SECRET;
    process.env.WS_ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3100';

    // Initialize JWT before creating WebSocketServer
    initializeJWT({
      accessSecret: TEST_JWT_SECRET,
      refreshSecret: TEST_JWT_REFRESH_SECRET,
    });

    // Create HTTP server for WebSocket attachment
    httpServer = createServer((_req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    // Create WebSocket server
    wsServer = new WebSocketServer(httpServer);

    // Start HTTP server
    return new Promise<void>(resolve => {
      httpServer.listen(TEST_PORT, () => {
        baseUrl = `ws://localhost:${TEST_PORT}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    return new Promise<void>((resolve, reject) => {
      // Close WebSocket server first
      wsServer.close();

      // Close HTTP server
      httpServer.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('Authentication', () => {
    it('should reject connection without authentication token', done => {
      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      ws.on('error', error => {
        expect(error.message).toContain('Unexpected server response: 401');
        done();
      });

      ws.on('open', () => {
        done(new Error('Connection should have been rejected'));
      });
    });

    it('should reject connection with invalid token', done => {
      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: 'Bearer invalid-token',
        },
      });

      ws.on('error', error => {
        expect(error.message).toContain('Unexpected server response: 401');
        done();
      });

      ws.on('open', () => {
        done(new Error('Connection should have been rejected'));
      });
    });

    it('should accept connection with valid JWT token', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('open', () => {
        ws.close();
        done();
      });

      ws.on('error', error => {
        done(error);
      });
    });

    it('should reject expired JWT token', done => {
      const token = sign(
        { userId: 'user-123', username: 'testuser' },
        TEST_JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('error', error => {
        expect(error.message).toContain('Unexpected server response: 401');
        done();
      });

      ws.on('open', () => {
        done(new Error('Expired token should have been rejected'));
      });
    });
  });

  describe('Origin Validation', () => {
    it('should reject connection from unauthorized origin', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://malicious-site.com',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('error', error => {
        expect(error.message).toContain('Unexpected server response: 403');
        done();
      });

      ws.on('open', () => {
        done(new Error('Unauthorized origin should have been rejected'));
      });
    });

    it('should accept connection from whitelisted origin', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('open', () => {
        ws.close();
        done();
      });

      ws.on('error', error => {
        done(error);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should accept messages within rate limit', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      let messagesReceived = 0;
      const messagesToSend = 5;

      ws.on('open', () => {
        // Send 5 messages (well within 60/min limit)
        for (let i = 0; i < messagesToSend; i++) {
          ws.send(
            JSON.stringify({
              type: 'join',
              gameId: `game-${i}`,
            })
          );
        }
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type !== 'error') {
          messagesReceived++;
        }

        if (messagesReceived === messagesToSend) {
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        done(error);
      });

      // Timeout if messages don't arrive
      setTimeout(() => {
        if (messagesReceived < messagesToSend) {
          done(new Error(`Only received ${messagesReceived}/${messagesToSend} messages`));
        }
      }, 2000);
    });

    it('should reject messages exceeding rate limit', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      let rateLimitErrorReceived = false;

      ws.on('open', () => {
        // Send 65 messages rapidly (exceeds 60/min limit)
        for (let i = 0; i < 65; i++) {
          ws.send(
            JSON.stringify({
              type: 'join',
              gameId: `game-${i}`,
            })
          );
        }
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.code === 'RATE_LIMIT_EXCEEDED') {
          rateLimitErrorReceived = true;
          expect(message.retryAfter).toBeGreaterThan(0);
          ws.close();
          done();
        }
      });

      ws.on('error', error => {
        if (!rateLimitErrorReceived) {
          done(error);
        }
      });

      setTimeout(() => {
        if (!rateLimitErrorReceived) {
          done(new Error('Rate limit error not received'));
        }
      }, 3000);
    });
  });

  describe('Input Validation', () => {
    let ws: WebSocket;
    let token: string;

    beforeEach(done => {
      token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('open', () => done());
      ws.on('error', error => done(error));
    });

    afterEach(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    it('should reject oversized messages', done => {
      const largeMessage = JSON.stringify({
        type: 'join',
        gameId: 'game-123',
        data: 'x'.repeat(11000), // Exceeds 10KB limit
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.code === 'MESSAGE_TOO_LARGE') {
          expect(message.maxSize).toBe(10240);
          done();
        }
      });

      ws.send(largeMessage);

      setTimeout(() => done(new Error('Size limit error not received')), 2000);
    });

    it('should reject invalid JSON', done => {
      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.code === 'INVALID_JSON') {
          done();
        }
      });

      ws.send('not valid json{');

      setTimeout(() => done(new Error('JSON validation error not received')), 2000);
    });

    it('should reject unknown message types', done => {
      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.code === 'INVALID_MESSAGE_TYPE') {
          expect(message.allowedTypes).toContain('join');
          expect(message.allowedTypes).toContain('leave');
          done();
        }
      });

      ws.send(JSON.stringify({ type: 'unknown-type' }));

      setTimeout(() => done(new Error('Type validation error not received')), 2000);
    });

    it('should reject invalid gameId format', done => {
      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error' && message.code === 'INVALID_GAME_ID') {
          done();
        }
      });

      ws.send(
        JSON.stringify({
          type: 'join',
          gameId: 'not-a-valid-uuid',
        })
      );

      setTimeout(() => done(new Error('GameId validation error not received')), 2000);
    });

    it('should accept valid join message', done => {
      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          expect(message.gameId).toBe('550e8400-e29b-41d4-a716-446655440000');
          done();
        }
      });

      ws.send(
        JSON.stringify({
          type: 'join',
          gameId: '550e8400-e29b-41d4-a716-446655440000',
        })
      );

      setTimeout(() => done(new Error('Join confirmation not received')), 2000);
    });
  });

  describe('Room Broadcasting', () => {
    it('should broadcast messages to all clients in same room', done => {
      const token1 = sign({ userId: 'user-1', username: 'user1' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const token2 = sign({ userId: 'user-2', username: 'user2' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const gameId = '550e8400-e29b-41d4-a716-446655440000';
      let client1Ready = false;
      let client2Ready = false;
      let broadcastReceived = false;

      const ws1 = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token1}`,
        },
      });

      const ws2 = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token2}`,
        },
      });

      ws1.on('open', () => {
        ws1.send(JSON.stringify({ type: 'join', gameId }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({ type: 'join', gameId }));
      });

      ws1.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          client1Ready = true;
          checkBroadcast();
        }
        if (message.type === 'game_event' && message.event === 'test') {
          broadcastReceived = true;
        }
      });

      ws2.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          client2Ready = true;
          checkBroadcast();
        }
      });

      function checkBroadcast() {
        if (client1Ready && client2Ready) {
          // Broadcast from server (simulated)
          wsServer.broadcast(gameId, {
            type: 'game_event',
            event: 'test',
            data: 'broadcast test',
          });

          setTimeout(() => {
            if (broadcastReceived) {
              ws1.close();
              ws2.close();
              done();
            } else {
              done(new Error('Broadcast not received by client'));
            }
          }, 500);
        }
      }

      setTimeout(() => {
        if (!broadcastReceived) {
          done(new Error('Test timeout'));
        }
      }, 3000);
    });

    it('should not broadcast messages to clients in different rooms', done => {
      const token1 = sign({ userId: 'user-1', username: 'user1' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const token2 = sign({ userId: 'user-2', username: 'user2' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const gameId1 = '550e8400-e29b-41d4-a716-446655440000';
      const gameId2 = '660e8400-e29b-41d4-a716-446655440001';
      let client1Ready = false;
      let client2Ready = false;
      let incorrectBroadcastReceived = false;

      const ws1 = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token1}`,
        },
      });

      const ws2 = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token2}`,
        },
      });

      ws1.on('open', () => {
        ws1.send(JSON.stringify({ type: 'join', gameId: gameId1 }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({ type: 'join', gameId: gameId2 }));
      });

      ws1.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          client1Ready = true;
          checkIsolation();
        }
      });

      ws2.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          client2Ready = true;
          checkIsolation();
        }
        if (message.type === 'game_event' && message.gameId === gameId1) {
          incorrectBroadcastReceived = true;
        }
      });

      function checkIsolation() {
        if (client1Ready && client2Ready) {
          // Broadcast only to gameId1
          wsServer.broadcast(gameId1, {
            type: 'game_event',
            gameId: gameId1,
            event: 'test',
          });

          setTimeout(() => {
            if (incorrectBroadcastReceived) {
              done(new Error('Broadcast leaked to wrong room'));
            } else {
              ws1.close();
              ws2.close();
              done();
            }
          }, 1000);
        }
      }

      setTimeout(() => done(new Error('Test timeout')), 3000);
    });
  });

  describe('Heartbeat & Connection Health', () => {
    it('should respond to ping with pong', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('open', () => {
        ws.ping();
      });

      ws.on('pong', () => {
        ws.close();
        done();
      });

      ws.on('error', error => {
        done(error);
      });

      setTimeout(() => done(new Error('Pong not received')), 2000);
    });

    it('should send periodic ping to client', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('ping', () => {
        ws.close();
        done();
      });

      ws.on('error', error => {
        done(error);
      });

      // Server sends ping every 30 seconds, wait up to 35 seconds
      setTimeout(() => done(new Error('Server ping not received')), 35000);
    }, 40000); // Extend test timeout
  });

  describe('Connection Cleanup', () => {
    it('should remove client from room on disconnect', done => {
      const token = sign({ userId: 'user-123', username: 'testuser' }, TEST_JWT_SECRET, {
        expiresIn: '1h',
      });

      const gameId = '550e8400-e29b-41d4-a716-446655440000';

      const ws = new WebSocket(baseUrl, {
        headers: {
          Origin: 'http://localhost:3000',
          Authorization: `Bearer ${token}`,
        },
      });

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'join', gameId }));
      });

      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        if (message.type === 'joined') {
          // Verify client is in room
          const stats = wsServer.getStats();
          expect(stats.totalConnections).toBe(1);

          // Close connection
          ws.close();

          // Wait for cleanup
          setTimeout(() => {
            const statsAfter = wsServer.getStats();
            expect(statsAfter.totalConnections).toBe(0);
            done();
          }, 500);
        }
      });

      ws.on('error', error => {
        done(error);
      });
    });
  });
});
