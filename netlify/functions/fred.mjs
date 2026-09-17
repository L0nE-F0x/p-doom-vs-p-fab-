import { proxyGet } from '../../src/lib/proxy.mjs';

export default async req => proxyGet(req, {
  prefix: '/api/fred',
  origin: 'https://api.stlouisfed.org/fred/',
  keyEnv: 'FRED_API_KEY',
  extraQuery: { file_type: 'json' },
});

export const config = { path: '/api/fred/*' };
