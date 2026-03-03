import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import type { IncomingMessage } from 'node:http';
import * as Sentry from '@sentry/node';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/request-id.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import healthRouter from './routes/health.js';
import excusesRouter from './routes/excuses.js';
import attacksRouter from './routes/attacks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATIC_PATTERN = /^\/(css|js|img)\//;
const STATIC_FILES = new Set(['/robots.txt', '/sitemap.xml', '/favicon.svg']);

function isStaticRequest(urlPath: string): boolean {
  return STATIC_PATTERN.test(urlPath) || STATIC_FILES.has(urlPath);
}

export function createApp(): express.Express {
  const app = express();

  // Trust proxy (behind Traefik + CF Tunnel)
  app.set('trust proxy', 1);

  // 1. Request ID
  app.use(requestId);

  // 2. Security headers (CSP allows self + Google Fonts for landing page)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://umami.bombeck.io'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https://umami.bombeck.io'],
      },
    },
  }));

  // 3. CORS
  app.use(cors({
    origin: config.CORS_ORIGINS === '*' ? '*' : config.CORS_ORIGINS.split(','),
  }));

  // 4. Body parsing
  app.use(express.json({ limit: '1mb' }));

  // 5. Structured logging (skip /health and static assets)
  app.use((pinoHttp as unknown as typeof pinoHttp.default)({
    logger,
    autoLogging: {
      ignore: (req: IncomingMessage) =>
        req.url === '/health' || isStaticRequest(req.url || ''),
    },
    customProps: (req: IncomingMessage) => ({ requestId: (req as Express.Request).id }),
  }));

  // 6. Sentry request handler
  if (config.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // 7. Rate limiting (skip /health and static assets)
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || isStaticRequest(req.path),
    handler: (_req, res) => {
      if (_req.headers.accept?.includes('text/html') && !_req.headers.accept?.includes('application/json')) {
        res.status(429).sendFile(path.join(__dirname, '..', 'public', '429.html'));
        return;
      }
      res.status(429).json({ data: null, error: 'too many requests' });
    },
  }));

  // 8. Static files (landing page)
  app.use(express.static(path.join(__dirname, '..', 'public'), {
    maxAge: '1d',
    index: false,
  }));

  // 9. Landing page route (host-based)
  app.get('/', (req, res, next) => {
    const host = (req.hostname || '').toLowerCase();
    if (host === config.LANDING_HOST || host === 'localhost') {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    } else {
      // Non-landing hosts redirect to landing page
      res.redirect(301, `https://${config.LANDING_HOST}/`);
    }
  });

  // 10. API Routes
  app.use(healthRouter);
  app.use(excusesRouter);
  app.use(attacksRouter);

  // 11. 404
  app.use(notFoundHandler);

  // 12. Global error handler
  app.use(errorHandler);

  return app;
}
