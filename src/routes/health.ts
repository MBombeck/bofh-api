import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      version: '3.0.0',
      uptime: Math.floor(process.uptime()),
    },
    error: null,
  });
});

export default router;
