import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = { matcher: '/:path*' }

const UPSTREAM = 'https://app---wdb-1ddcc6e3.base44.app'

export default async function middleware(req: NextRequest) {
  const incomingHost = req.headers.get('host') || 'www.wdb-de.de'
  const url = new URL(req.nextUrl.pathname + req.nextUrl.search, UPSTREAM)

  const init: RequestInit = {
    method: req.method,
    headers: {
      ...Object.fromEntries(req.headers),
      'x-forwarded-host': incomingHost,
      'x-forwarded-proto': 'https',
      'x-forwarded-port': '443'
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (req as any).body,
    redirect: 'manual'
  }

  const upstreamRes = await fetch(url.toString(), init)
  const headers = new Headers(upstreamRes.headers)

  headers.delete('content-security-policy')
  headers.delete('content-security-policy-report-only')

  headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload')
  headers.set('referrer-policy', 'same-origin')
  headers.set('x-content-type-options', 'nosniff')
  headers.set('x-frame-options', 'SAMEORIGIN')
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')

  headers.set('x-proxy', 'wdb-via-vercel')

  const loc = headers.get('location')
  if (loc && loc.startsWith(UPSTREAM)) {
    headers.set('location', loc.replace(UPSTREAM, `https://${incomingHost}`))
  }

  return new NextResponse(upstreamRes.body, { status: upstreamRes.status, headers })
}


