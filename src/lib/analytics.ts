import { config, VERSION } from '../config.js';
import { logger } from './logger.js';

interface AnalyticsEvent {
  name: string;
  url: string;
  data?: Record<string, unknown>;
}

// Server-seitiges Tracking gegen die selbst gehostete Rybbit-Instanz.
// Es werden nur der API-Pfad, der Event-Name und aggregierbare Zahlen gesendet.
// Keine Client-IP, kein Client-User-Agent - alle Aufrufe erscheinen als ein
// technischer Besucher (bofh-api). Der API-Key (Scope ingest:write) sorgt dafuer,
// dass Rybbit den Server-Aufruf nicht als Bot verwirft.
const HOSTNAME = 'bofh-api.ioioio.dev';

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': `Mozilla/5.0 (compatible; bofh-api/${VERSION})`,
  };
  if (config.RYBBIT_API_KEY) h['Authorization'] = `Bearer ${config.RYBBIT_API_KEY}`;
  return h;
}

function send(body: Record<string, unknown>): void {
  fetch(`${config.RYBBIT_URL}/api/track`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      site_id: config.RYBBIT_SITE_ID,
      hostname: HOSTNAME,
      language: 'en',
      user_agent: `bofh-api/${VERSION}`,
      ...body,
    }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => {
    logger.warn({ err: err.message }, 'rybbit event failed');
  });
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!config.RYBBIT_URL || !config.RYBBIT_SITE_ID) return;

  // Pageview - zaehlt als Aufruf im Dashboard (wie bisher bei Umami)
  send({ type: 'pageview', pathname: event.url });

  // Custom Event - erscheint im Events-Bereich
  send({
    type: 'custom_event',
    pathname: event.url,
    event_name: event.name,
    ...(event.data ? { properties: JSON.stringify(event.data) } : {}),
  });
}
