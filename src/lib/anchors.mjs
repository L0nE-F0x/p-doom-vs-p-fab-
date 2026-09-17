/**
 * Load frozen anchors without JSON import attributes — Netlify's function
 * bundler still chokes on `with { type: "json" }`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadAnchors() {
  const candidates = [
    join(process.cwd(), 'config/anchors.json'),
    join(dirname(fileURLToPath(import.meta.url)), '../../config/anchors.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  throw new Error('config/anchors.json not found');
}
