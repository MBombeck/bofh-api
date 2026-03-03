import { z } from 'zod';

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
