import { Router } from 'express';
import { z } from 'zod';
import { apiKeyAuth } from '../middleware/api-key.js';
import * as attacksService from '../services/attacks.service.js';
import { trackEvent } from '../lib/umami.js';

const router = Router();

router.get('/internal/attacks', apiKeyAuth, async (req, res, next) => {
  try {
    const sinceMinutes = z.coerce.number().int().min(1).max(1440).default(60).parse(req.query.since);
    const result = await attacksService.getAttacks(sinceMinutes);
    trackEvent({ name: 'attacks_query', url: '/internal/attacks', data: { since: sinceMinutes, total: result.total } });
    // PewPew expects flat { attacks, total } — no envelope
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
