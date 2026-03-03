import { config, VERSION } from '../config.js';
import { logger } from './logger.js';

interface UmamiEvent {
  name: string;
  url: string;
  data?: Record<string, unknown>;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': `Mozilla/5.0 (compatible; bofh-api/${VERSION})`,
};

function send(body: unknown): void {
  fetch(`${config.UMAMI_URL}/api/send`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    logger.warn({ err: err.message }, 'umami event failed');
  });
}

export function trackEvent(event: UmamiEvent): void {
  if (!config.UMAMI_URL || !config.UMAMI_WEBSITE_ID) return;

  const base = {
    website: config.UMAMI_WEBSITE_ID,
    hostname: 'bofh-api.ioioio.dev',
    url: event.url,
    language: 'en',
  };

  // Pageview — registers as visit/view in Umami dashboard
  send({ type: 'event', payload: base });

  // Custom event — shows up in Events section
  send({
    type: 'event',
    payload: { ...base, name: event.name, data: event.data },
  });
}
