import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { TOTAL } from '../services/excuses.service.js';

const app = createApp();

describe('GET /v1/excuses/random', () => {
  it('returns a single random excuse', async () => {
    const res = await request(app).get('/v1/excuses/random');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('excuse');
    expect(res.body.meta).toHaveProperty('total', TOTAL);
    expect(res.body.error).toBeNull();
  });

  it('returns multiple excuses with count', async () => {
    const res = await request(app).get('/v1/excuses/random?count=3');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.meta).toHaveProperty('count', 3);
    expect(res.body.meta).toHaveProperty('total', TOTAL);
  });

  it('rejects count > 50', async () => {
    const res = await request(app).get('/v1/excuses/random?count=51');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects count=0', async () => {
    const res = await request(app).get('/v1/excuses/random?count=0');
    expect(res.status).toBe(400);
  });

  it('returns plain text with Accept: text/plain', async () => {
    const res = await request(app)
      .get('/v1/excuses/random')
      .set('Accept', 'text/plain');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(typeof res.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
  });

  it('returns multiple plain text lines with count', async () => {
    const res = await request(app)
      .get('/v1/excuses/random?count=3')
      .set('Accept', 'text/plain');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    const lines = res.text.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('sets Vary: Accept header', async () => {
    const res = await request(app).get('/v1/excuses/random');
    expect(res.headers['vary']).toMatch(/Accept/i);
  });
});

describe('GET /v1/excuses/:id', () => {
  it('returns excuse by valid ID', async () => {
    const res = await request(app).get('/v1/excuses/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
    expect(res.body.data).toHaveProperty('excuse');
    expect(res.body.error).toBeNull();
  });

  it('returns 404 for out-of-range ID', async () => {
    const res = await request(app).get(`/v1/excuses/${TOTAL + 1}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for non-numeric ID', async () => {
    const res = await request(app).get('/v1/excuses/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns plain text with Accept: text/plain', async () => {
    const res = await request(app)
      .get('/v1/excuses/1')
      .set('Accept', 'text/plain');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text.length).toBeGreaterThan(0);
  });
});

describe('GET /v1/excuses', () => {
  it('returns all excuses', async () => {
    const res = await request(app).get('/v1/excuses');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(TOTAL);
    expect(res.body.meta.count).toBe(TOTAL);
    expect(res.body.meta.total).toBe(TOTAL);
  });

  it('returns plain text with all excuses newline-separated', async () => {
    const res = await request(app)
      .get('/v1/excuses')
      .set('Accept', 'text/plain');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    const lines = res.text.split('\n');
    expect(lines).toHaveLength(TOTAL);
  });
});
