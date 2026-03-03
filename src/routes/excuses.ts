import { Router } from 'express';
import { z } from 'zod';
import * as excusesService from '../services/excuses.service.js';
import { trackEvent } from '../lib/umami.js';

const router = Router();

router.get('/v1/excuses/random/:num?', (req, res, next) => {
  try {
    const count = z.coerce.number().int().min(1).max(50).default(1).parse((req.params as Record<string, string>).num);
    const data = excusesService.getRandom(count);
    trackEvent({ name: 'excuse_random', url: '/v1/excuses/random', data: { count } });
    res.json({ data, error: null });
  } catch (err) {
    next(err);
  }
});

router.get('/v1/excuses/id/:id', (req, res, next) => {
  try {
    const id = z.coerce.number().int().min(1).parse(req.params.id);
    const data = excusesService.getById(id);
    trackEvent({ name: 'excuse_by_id', url: '/v1/excuses/id', data: { id } });
    res.json({ data, error: null });
  } catch (err) {
    next(err);
  }
});

router.get('/v1/excuses/all', (_req, res) => {
  const data = excusesService.getAll();
  trackEvent({ name: 'excuse_all', url: '/v1/excuses/all' });
  res.json({ data, error: null });
});

export default router;
