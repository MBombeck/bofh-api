import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
export const VERSION: string = pkg.version;

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  ATTACKS_API_KEY: z.string().min(1),
  TRAEFIK_LOG_PATH: z.string().default('/var/log/traefik/access.log'),
  SENTRY_DSN: z.string().optional(),
  UMAMI_URL: z.string().optional(),
  UMAMI_WEBSITE_ID: z.string().optional(),
  CORS_ORIGINS: z.string().default('*'),
  LANDING_HOST: z.string().default('bofh.bombeck.io'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
