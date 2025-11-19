// ESM shim to align legacy JS entry with the new TypeScript app factory
// Export only the Express app from the TS source. Avoid re-exporting TS store modules
// to prevent Node from importing TypeScript directly in environments that bypass Vite.
import { createServer } from 'node:http';
import { WebSocketServer } from './websocket/WebSocketServer';
import { gameEventEmitter } from './events';
import { app } from './app';
import { getLogger } from '@political-sphere/shared';

const logger = getLogger({ service: 'api' });

export { app };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = parseInt(process.env.PORT || '4000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  // Create HTTP server
  const server = createServer(app);

  // Initialize WebSocket server
  const wsServer = new WebSocketServer(server, {
    requireAuth: process.env.NODE_ENV === 'production',
    allowedOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined,
  });

  // Connect event emitter to WebSocket server
  gameEventEmitter.setWebSocketServer(wsServer);

  server.listen(PORT, HOST, () => {
    logger.info(`API server with WebSocket support listening on http://${HOST}:${PORT}`);
  });
}
