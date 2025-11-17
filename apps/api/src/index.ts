/**
 * API Server
 * Main Express application with auth and game routes
 */
// Load environment variables from .env if present (local dev convenience)
import 'dotenv/config';

import { startTelemetry } from '@political-sphere/shared';
import { app } from './app';

const PORT = process.env.PORT || 3001;

// Initialize OpenTelemetry before starting the server
startTelemetry({
  serviceName: 'api',
  serviceVersion: process.env.npm_package_version || '0.0.0',
  environment: process.env.NODE_ENV || 'development',
})
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
      console.log(`🎮 Game endpoints: http://localhost:${PORT}/game`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize OpenTelemetry:', error);
    process.exit(1);
  });

export default app;
