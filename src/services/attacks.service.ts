import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { config } from '../config.js';

interface AttackRule {
  action: string;
  patterns: RegExp[];
}

const ATTACK_RULES: AttackRule[] = [
  { action: 'WordPress Exploit', patterns: [/\/wp-admin/i, /\/wp-login/i, /\/xmlrpc\.php/i, /\/wp-content\/uploads/i, /\/wp-includes/i] },
  { action: 'Credential Theft', patterns: [/\/\.env/i, /\/\.git/i, /\/config\.php/i, /\/config\.yml/i, /\/config\.json/i, /\/passwd/i, /\/credentials/i, /\/\.aws/i, /\/\.ssh/i] },
  { action: 'Database Probe', patterns: [/\/phpmyadmin/i, /\/adminer/i, /\/mysql/i, /\/pma\//i, /\/dbadmin/i, /\/solr/i] },
  { action: 'Framework Exploit', patterns: [/\/actuator/i, /\/_ignition/i, /\/telescope/i, /\/vendor\//i, /\/laravel/i, /XDEBUG_SESSION/i, /\/login\.action/i, /\/struts/i] },
  { action: 'IoT Exploit', patterns: [/\/SDK\//i, /\/HNAP1/i, /\/GponForm/i, /\/boaform/i, /\/cgi-bin/i, /\/goform/i, /\/formLogin/i] },
  { action: 'RCE Attempt', patterns: [/\/shell/i, /\/eval/i, /\/exec/i, /\/cmd/i, /\/command/i, /\/setup\.php/i] },
  { action: 'Exchange Exploit', patterns: [/\/owa\//i, /\/exchange\//i, /\/Autodiscover/i, /\/ecp\//i, /\/aspnet_client/i] },
  { action: 'VPN Probe', patterns: [/\/dana-na/i, /\/vpn\//i, /\/remote\//i, /\/sslvpn/i, /\/portal\/redirection/i] },
  { action: 'Admin Panel Scan', patterns: [/\/admin\//i, /\/manager\//i, /\/console\//i, /\/webui\//i, /\/debug/i, /\/dashboard/i] },
  { action: 'Path Traversal', patterns: [/\.\.\//, /\.\.%2f/i, /\.\.%5c/i] },
  { action: 'Auth Brute-Force', patterns: [/\/login/i, /\/signin/i, /\/auth/i, /\/api\/auth/i, /\/user\/login/i] },
  { action: 'Cloud Recon', patterns: [/\/api\/v1\/pods/i, /\/metadata\/v1/i, /\/latest\/meta-data/i, /\/\.kube/i] },
];

interface Attack {
  ts: string;
  ip: string;
  host: string;
  method: string;
  path: string;
  status: number;
  action: string;
  ua: string;
}

function classify(path: string): string | null {
  for (const rule of ATTACK_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(path)) return rule.action;
    }
  }
  return null;
}

// In-memory cache to avoid re-parsing the log file on every request
let cache: { attacks: Attack[]; sinceMinutes: number; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function getAttacks(sinceMinutes: number): Promise<{ attacks: Attack[]; total: number }> {
  if (cache && cache.sinceMinutes === sinceMinutes && Date.now() < cache.expiresAt) {
    return { attacks: cache.attacks, total: cache.attacks.length };
  }

  const logPath = config.TRAEFIK_LOG_PATH;

  if (!existsSync(logPath)) {
    return { attacks: [], total: 0 };
  }

  const cutoff = Date.now() - sinceMinutes * 60 * 1000;
  const maxEntries = 1000;
  const attacks: Attack[] = [];

  const rl = createInterface({
    input: createReadStream(logPath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (attacks.length >= maxEntries) break;

    try {
      const entry = JSON.parse(line);

      const ts: string = entry.StartUTC || entry.time || '';
      const entryTime = new Date(ts).getTime();
      if (entryTime < cutoff) continue;

      const ip: string =
        entry['request_Cf-Connecting-Ip'] ||
        entry['request_CF-Connecting-IP'] ||
        entry.ClientHost ||
        '';
      if (!ip) continue;

      const pathStr: string = entry.RequestPath || '';
      const status: number = entry.DownstreamStatus || 0;
      const method: string = entry.RequestMethod || '';
      const ua: string = entry['request_User-Agent'] || '';
      const host: string = entry.RequestHost || '';

      let action = classify(pathStr);

      if (!action && (status === 404 || status === 403)) {
        action = 'Port Scan';
      }

      if (action) {
        attacks.push({ ts, ip, host, method, path: pathStr, status, action, ua });
      }
    } catch {
      // skip malformed lines
    }
  }

  cache = { attacks, sinceMinutes, expiresAt: Date.now() + CACHE_TTL_MS };
  return { attacks, total: attacks.length };
}
