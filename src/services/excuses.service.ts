import { createRequire } from 'node:module';
import { ApiError } from '../lib/errors.js';

const require = createRequire(import.meta.url);

interface Excuse {
  id: number;
  quote: string;
  source: string;
  date: string;
}

const excuses: Excuse[] = require('../data/excuses.json');

export function getRandom(count: number): Excuse[] {
  const limit = Math.min(Math.max(1, count), excuses.length);
  const indices = new Set<number>();

  while (indices.size < limit) {
    indices.add(Math.floor(Math.random() * excuses.length));
  }

  return [...indices].map((i) => excuses[i]);
}

export function getById(id: number): Excuse {
  const excuse = excuses[id - 1];
  if (!excuse) {
    throw new ApiError(404, `excuse #${id} not found`);
  }
  return excuse;
}

export function getAll(): Excuse[] {
  return excuses;
}
