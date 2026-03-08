import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/node';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', '..', 'public');

const ERROR_PAGES = new Set([404, 429, 500]);

function wantsHtml(accept: string | undefined): boolean {
  if (!accept) return false;
  return accept.includes('text/html') && !accept.includes('application/json');
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'not found'));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode: number;
  let code: string;
  let message: string;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.errors.map((e) => e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message).join(', ');
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'invalid JSON body';
  } else {
    statusCode = 500;
    code = 'INTERNAL_ERROR';
    message = 'internal server error';
  }

  if (statusCode >= 500) {
    Sentry.captureException(err);
    logger.error({ err, requestId: req.id, path: req.path }, 'unhandled error');
  }

  if (wantsHtml(req.headers.accept) && ERROR_PAGES.has(statusCode)) {
    res.status(statusCode).sendFile(path.join(publicDir, `${statusCode}.html`));
    return;
  }

  res.status(statusCode).json({
    data: null,
    meta: null,
    error: { code, message },
  });
};
