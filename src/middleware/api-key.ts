import { timingSafeEqual, createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';

const expectedHash = createHash('sha256').update(config.ATTACKS_API_KEY).digest();

export const apiKeyAuth: RequestHandler = (req, _res, next) => {
  const key = req.headers['x-api-key'] as string | undefined;
  if (!key) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'missing api key'));
  }
  const keyHash = createHash('sha256').update(key).digest();
  if (!timingSafeEqual(keyHash, expectedHash)) {
    return next(new ApiError(403, 'FORBIDDEN', 'invalid api key'));
  }
  next();
};
