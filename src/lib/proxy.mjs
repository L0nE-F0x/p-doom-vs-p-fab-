/**
 * Server-side API proxy. Keys stay in process.env; the browser never sees them.
 */
export function buildProxyUrl(reqUrl, { prefix, origin, apiKey, extraQuery = {} }) {
  const incoming = new URL(reqUrl);
  const splat = incoming.pathname.replace(prefix, '').replace(/^\//, '');
  const dest = new URL(splat, origin.endsWith('/') ? origin : origin + '/');

  for (const [k, v] of incoming.searchParams) {
    if (k === 'api_key') continue;
    dest.searchParams.set(k, v);
  }
  dest.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(extraQuery)) {
    if (!dest.searchParams.has(k)) dest.searchParams.set(k, v);
  }
  return dest;
}

export async function proxyGet(req, { prefix, origin, keyEnv, extraQuery = {} }) {
  const key = process.env[keyEnv];
  if (!key) {
    return Response.json({ error: `missing ${keyEnv}` }, { status: 500 });
  }

  const dest = buildProxyUrl(req.url, { prefix, origin, apiKey: key, extraQuery });
  const res = await fetch(dest);
  const type = res.headers.get('content-type') || 'application/json';
  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': type, 'cache-control': 'public, max-age=3600' },
  });
}
