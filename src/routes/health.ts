import { Router } from 'express';
import { VERSION } from '../config.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({
    data: {
      status: 'ok',
      version: VERSION,
      uptime: Math.floor(process.uptime()),
    },
    meta: null,
    error: null,
  });
});

export default router;
