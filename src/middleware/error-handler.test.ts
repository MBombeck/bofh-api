import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('error handling', () => {
  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('not found');
  });

  it('returns consistent error envelope', async () => {
    const res = await request(app).get('/v1/excuses/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('data', null);
    expect(res.body).toHaveProperty('meta', null);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});

describe('API key auth', () => {
  it('rejects /internal/attacks without key', async () => {
    const res = await request(app).get('/internal/attacks');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects /internal/attacks with wrong key', async () => {
    const res = await request(app)
      .get('/internal/attacks')
      .set('X-API-Key', 'wrong-key');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('accepts /internal/attacks with correct key', async () => {
    const res = await request(app)
      .get('/internal/attacks')
      .set('X-API-Key', 'test-key-for-vitest');
    expect(res.status).toBe(200);
  });
});
