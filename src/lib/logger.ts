import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'bofh-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.NODE_ENV === 'development' && {
    transport: { target: 'pino-pretty' },
  }),
});
