/**
 * API Server
 * Main Express application with auth and game routes
 */
// Load environment variables from .env if present (local dev convenience)
import 'dotenv/config';

import { createLogger, startTelemetry } from '@political-sphere/shared';
import { app } from './app';

const logger = createLogger({ service: 'api-main' });
const PORT = process.env.PORT || 3001;

// Initialize OpenTelemetry before starting the server
startTelemetry({
  serviceName: 'api',
  serviceVersion: process.env.npm_package_version || '0.0.0',
  environment: process.env.NODE_ENV || 'development',
})
  .then(() => {
    app.listen(PORT, () => {
      logger.info('🚀 API server running', {
        msg: '🚀 API server running',
        port: PORT,
        healthCheck: `http://localhost:${PORT}/health`,
        authEndpoints: `http://localhost:${PORT}/auth`,
        gameEndpoints: `http://localhost:${PORT}/game`,
      });
    });
  })
  .catch(error => {
    logger.fatal('Failed to initialize OpenTelemetry', { err: error });
    process.exit(1);
  });

export default app;
