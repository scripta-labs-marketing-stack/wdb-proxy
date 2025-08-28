// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: '/:path*'
};

export default async function middleware(req: NextRequest) {
  const upstream = new URL(
    req.nextUrl.pathname + req.nextUrl.search,
    'https://app---wdb-1ddcc6e3.base44.app'
  );

  const init: RequestInit = {
    method: req.method,
    headers: Object.fromEntries(req.headers),
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (req.body as any),
    redirect: 'manual'
  };

  const res = await fetch(upstream.toString(), init);
  const headers = new Headers(res.headers);

  // CSP entfernen
  headers.delete('content-security-policy');
  headers.delete('content-security-policy-report-only');

  // Eigene Security-Header setzen
  headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('referrer-policy', 'same-origin');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

  // Redirects vom Upstream auf eigene Domain umschreiben
  const location = headers.get('location');
  if (location && location.startsWith('https://app---wdb-1ddcc6e3.base44.app')) {
    headers.set(
      'location',
      location.replace('https://app---wdb-1ddcc6e3.base44.app', 'https://www.wdb-de.de')
    );
  }

  return new NextResponse(res.body, { status: res.status, headers });
}
