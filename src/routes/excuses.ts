import { Router } from 'express';
import { z } from 'zod';
import type { Request } from 'express';
import * as excusesService from '../services/excuses.service.js';
import { trackEvent } from '../lib/umami.js';

const router = Router();

function wantsText(req: Request): boolean {
  return req.accepts(['json', 'text']) === 'text';
}

// GET /v1/excuses/random?count=N — random excuse(s)
router.get('/v1/excuses/random', (req, res) => {
  const count = z.coerce.number().int().min(1).max(50).optional().parse(req.query.count);

  if (count) {
    const data = excusesService.getRandom(count);
    trackEvent({ name: 'excuse_random', url: '/v1/excuses/random', data: { count } });
    res.set('Cache-Control', 'no-store');
    if (wantsText(req)) {
      res.vary('Accept').type('text').send(data.map((e) => e.excuse).join('\n'));
    } else {
      res.vary('Accept').json({ data, meta: { count: data.length, total: excusesService.TOTAL }, error: null });
    }
  } else {
    const [data] = excusesService.getRandom(1);
    trackEvent({ name: 'excuse_random', url: '/v1/excuses/random', data: { count: 1 } });
    res.set('Cache-Control', 'no-store');
    if (wantsText(req)) {
      res.vary('Accept').type('text').send(data.excuse);
    } else {
      res.vary('Accept').json({ data, meta: { total: excusesService.TOTAL }, error: null });
    }
  }
});

// GET /v1/excuses/:id — specific excuse by ID
router.get('/v1/excuses/:id', (req, res) => {
  const id = z.coerce.number().int().min(1).parse(req.params.id);
  const data = excusesService.getById(id);
  trackEvent({ name: 'excuse_by_id', url: `/v1/excuses/${id}`, data: { id } });
  res.set('Cache-Control', 'public, max-age=86400');
  if (wantsText(req)) {
    res.vary('Accept').type('text').send(data.excuse);
  } else {
    res.vary('Accept').json({ data, meta: { total: excusesService.TOTAL }, error: null });
  }
});

// GET /v1/excuses — all excuses
router.get('/v1/excuses', (req, res) => {
  const data = excusesService.getAll();
  trackEvent({ name: 'excuse_all', url: '/v1/excuses' });
  res.set('Cache-Control', 'public, max-age=86400');
  if (wantsText(req)) {
    res.vary('Accept').type('text').send(data.map((e) => e.excuse).join('\n'));
  } else {
    res.vary('Accept').json({ data, meta: { count: data.length, total: excusesService.TOTAL }, error: null });
  }
});

export default router;
