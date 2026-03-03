import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ApiError } from '../lib/errors.js';

interface RawExcuse {
  id: number;
  quote: string;
  source: string;
  date: string;
}

export interface Excuse {
  id: number;
  excuse: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw: RawExcuse[] = JSON.parse(
  readFileSync(path.join(__dirname, '../data/excuses.json'), 'utf-8'),
);

const excuses: Excuse[] = raw.map((e) => ({ id: e.id, excuse: e.quote }));

export const TOTAL = excuses.length;

export function getRandom(count: number): Excuse[] {
  const limit = Math.min(Math.max(1, count), excuses.length);
  const indices = Array.from({ length: excuses.length }, (_, i) => i);

  // Fisher-Yates shuffle (partial — only need `limit` elements)
  for (let i = indices.length - 1; i > indices.length - 1 - limit; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(-limit).map((i) => excuses[i]);
}

export function getById(id: number): Excuse {
  const excuse = excuses[id - 1];
  if (!excuse) {
    throw new ApiError(404, 'NOT_FOUND', `excuse #${id} not found`);
  }
  return excuse;
}

export function getAll(): Excuse[] {
  return excuses;
}
