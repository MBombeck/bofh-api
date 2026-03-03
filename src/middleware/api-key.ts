import type { RequestHandler } from 'express';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';

export const apiKeyAuth: RequestHandler = (req, _res, next) => {
  const key = req.query.key as string | undefined;
  if (!key || key !== config.ATTACKS_API_KEY) {
    return next(new ApiError(403, 'forbidden'));
  }
  next();
};
