// Sentry must be initialized before any other imports
import * as Sentry from '@sentry/node';

// Config is safe to import early (only reads env vars)
import { config } from './config.js';

if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Import app after Sentry init
import { createApp } from './app.js';
import { logger } from './lib/logger.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'bofh-api started');
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  if (config.SENTRY_DSN) Sentry.captureException(reason);
  process.exit(1);
});
