import { Router } from 'express';
import { VERSION } from '../config.js';
import * as excusesService from '../services/excuses.service.js';

const router = Router();

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'BOFH Excuses API',
    version: VERSION,
    description: `453 classic Bastard Operator From Hell excuses, served as a free JSON API.\n\nSupports content negotiation: set \`Accept: text/plain\` to receive plain text instead of JSON.`,
    license: { name: 'MIT', url: 'https://github.com/MBombeck/bofh/blob/main/LICENSE' },
    contact: { name: 'Marc Bombeck', url: 'https://bombeck.io' },
  },
  servers: [{ url: 'https://bofh.bombeck.io', description: 'Production' }],
  paths: {
    '/v1/excuses/random': {
      get: {
        summary: 'Random excuse(s)',
        operationId: 'getRandomExcuse',
        parameters: [{
          name: 'count', in: 'query', required: false,
          description: 'Number of random excuses (1–50). Omit for a single excuse.',
          schema: { type: 'integer', minimum: 1, maximum: 50 },
        }],
        responses: {
          '200': {
            description: 'Random excuse(s)',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/SingleExcuseResponse' },
                    { $ref: '#/components/schemas/MultiExcuseResponse' },
                  ],
                },
                examples: {
                  single: {
                    summary: 'Single excuse (no count)',
                    value: { data: { id: 42, excuse: 'Solar flares' }, meta: { total: 453 }, error: null },
                  },
                  multiple: {
                    summary: 'Multiple excuses (count=3)',
                    value: {
                      data: [{ id: 42, excuse: 'Solar flares' }, { id: 7, excuse: 'Cosmic rays' }, { id: 112, excuse: 'clock speed' }],
                      meta: { count: 3, total: 453 }, error: null,
                    },
                  },
                },
              },
              'text/plain': {
                schema: { type: 'string' },
                examples: {
                  single: { summary: 'Single excuse', value: 'Solar flares' },
                  multiple: { summary: 'Multiple (newline-separated)', value: 'Solar flares\nCosmic rays\nclock speed' },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/v1/excuses/{id}': {
      get: {
        summary: 'Excuse by ID',
        operationId: 'getExcuseById',
        parameters: [{
          name: 'id', in: 'path', required: true,
          description: 'Excuse ID (1–453)',
          schema: { type: 'integer', minimum: 1, maximum: 453 },
        }],
        responses: {
          '200': {
            description: 'Excuse found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SingleExcuseResponse' },
                example: { data: { id: 42, excuse: 'Solar flares' }, meta: { total: 453 }, error: null },
              },
              'text/plain': {
                schema: { type: 'string' },
                example: 'Solar flares',
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/v1/excuses': {
      get: {
        summary: 'All excuses',
        operationId: 'getAllExcuses',
        responses: {
          '200': {
            description: 'All 453 excuses',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MultiExcuseResponse' },
              },
              'text/plain': {
                schema: { type: 'string', description: 'One excuse per line' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['ok'] },
                        version: { type: 'string' },
                        uptime: { type: 'integer', description: 'Uptime in seconds' },
                      },
                    },
                    meta: { type: 'null' },
                    error: { type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Excuse: {
        type: 'object',
        required: ['id', 'excuse'],
        properties: {
          id: { type: 'integer', minimum: 1, maximum: 453 },
          excuse: { type: 'string' },
        },
      },
      SingleExcuseResponse: {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/Excuse' },
          meta: {
            type: 'object',
            properties: { total: { type: 'integer' } },
          },
          error: { type: 'null' },
        },
      },
      MultiExcuseResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Excuse' } },
          meta: {
            type: 'object',
            properties: {
              count: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
          error: { type: 'null' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          data: { type: 'null' },
          meta: { type: 'null' },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Invalid parameters',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Excuse not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      RateLimited: {
        description: 'Rate limit exceeded (1000 requests per 15 minutes)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
};

// Inject actual total at startup
function patchTotal(obj: unknown): void {
  if (obj && typeof obj === 'object') {
    const rec = obj as Record<string, unknown>;
    if (rec.maximum === 453) rec.maximum = excusesService.TOTAL;
    if (rec.total === 453) rec.total = excusesService.TOTAL;
    for (const v of Object.values(rec)) patchTotal(v);
  }
}
patchTotal(spec);

router.get('/openapi.json', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(spec);
});

export default router;
