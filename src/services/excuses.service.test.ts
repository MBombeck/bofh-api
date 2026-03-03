import { describe, it, expect } from 'vitest';
import { getRandom, getById, getAll, TOTAL } from './excuses.service.js';

describe('excuses.service', () => {
  it('loads all excuses', () => {
    const all = getAll();
    expect(all.length).toBe(TOTAL);
    expect(TOTAL).toBeGreaterThan(0);
  });

  it('getById returns correct excuse', () => {
    const excuse = getById(1);
    expect(excuse).toHaveProperty('id', 1);
    expect(excuse).toHaveProperty('excuse');
    expect(typeof excuse.excuse).toBe('string');
  });

  it('getById throws ApiError for invalid ID', () => {
    expect(() => getById(0)).toThrow();
    expect(() => getById(TOTAL + 1)).toThrow();
  });

  it('getRandom returns requested count', () => {
    const results = getRandom(5);
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('excuse');
    });
  });

  it('getRandom returns unique results', () => {
    const results = getRandom(20);
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('getRandom clamps to total', () => {
    const results = getRandom(9999);
    expect(results.length).toBe(TOTAL);
  });

  it('getRandom(1) returns one excuse', () => {
    const results = getRandom(1);
    expect(results).toHaveLength(1);
  });
});
