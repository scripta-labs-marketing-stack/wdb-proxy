import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = { matcher: '/:path*' }

// Deine Base44-Ziel-URL:
const UPSTREAM = 'https://app---wdb-1ddcc6e3.base44.app'

export default async function middleware(req: NextRequest) {
  const url = new URL(req.nextUrl.pathname + req.nextUrl.search, UPSTREAM)

  // Hostname deiner Domain bestimmen (www oder apex – hier www):
  const host = 'www.wdb-de.de'

  // Request an Base44 weiterreichen – aber mit deinem Host-Header!
  const init: RequestInit = {
    method: req.method,
    headers: {
      ...Object.fromEntries(req.headers),
      // wichtig: Host-Domain beibehalten
      host,
      'x-forwarded-host': host,
      'x-forwarded-proto': 'https',
      // optionals (schaden nicht):
      'x-forwarded-port': '443',
      'x-real-ip': req.ip ?? ''
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (req as any).body,
    redirect: 'manual'
  }

  const upstreamRes = await fetch(url.toString(), init)

  // Header anpassen
  const headers = new Headers(upstreamRes.headers)

  // Störende CSP von Upstream entfernen:
  headers.delete('content-security-policy')
  headers.delete('content-security-policy-report-only')
headers.set('x-proxy', 'wdb-via-vercel');

  // Eigene Security-Header setzen (CSP fügen wir später gezielt hinzu):
  headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload')
  headers.set('referrer-policy', 'same-origin')
  headers.set('x-content-type-options', 'nosniff')
  headers.set('x-frame-options', 'SAMEORIGIN')
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')

  // Absolute Redirects des Upstreams auf deine Domain umbiegen:
  const loc = headers.get('location')
  if (loc && loc.startsWith(UPSTREAM)) {
    headers.set('location', loc.replace(UPSTREAM, `https://${host}`))
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers
  })
}

