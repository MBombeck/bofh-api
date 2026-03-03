import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('GET /openapi.json', () => {
  it('returns valid OpenAPI 3.1 spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('BOFH Excuses API');
    expect(res.body.paths).toHaveProperty('/v1/excuses/random');
    expect(res.body.paths).toHaveProperty('/v1/excuses/{id}');
    expect(res.body.paths).toHaveProperty('/v1/excuses');
    expect(res.body.paths).toHaveProperty('/health');
  });

  it('sets long cache header', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.headers['cache-control']).toMatch(/max-age=86400/);
  });
});
