import { proxyGet } from '../../src/lib/proxy.mjs';

export default async req => proxyGet(req, {
  prefix: '/api/eia',
  origin: 'https://api.eia.gov/',
  keyEnv: 'EIA_API_KEY',
});

export const config = { path: '/api/eia/*' };
