import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Read by backend/src/middleware/client-ip.ts. Keep the names in step with it. */
const PROXY_SECRET_HEADER = 'x-asthiwar-proxy-secret';
const CLIENT_IP_HEADER = 'x-asthiwar-client-ip';

/**
 * Tells the API who the visitor is.
 *
 * Browser calls to /api/* are forwarded to the backend by the rewrite in
 * next.config.ts, so the backend only ever sees this deployment's address and
 * every per-IP rate limit became one bucket shared by all visitors. This attaches
 * the real client address, vouched for by a secret the backend also holds.
 *
 * The address is taken only on Vercel, which overwrites X-Forwarded-For and
 * X-Real-IP with the connecting client's address. Anywhere else those headers
 * are whatever the caller sent, so nothing is forwarded and the backend falls
 * back to the address it sees itself.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Never pass these through from the caller.
  headers.delete(PROXY_SECRET_HEADER);
  headers.delete(CLIENT_IP_HEADER);

  const secret = process.env.API_PROXY_SECRET;
  const clientIp = process.env.VERCEL
    ? (request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0])?.trim()
    : undefined;

  if (secret && clientIp) {
    headers.set(PROXY_SECRET_HEADER, secret);
    headers.set(CLIENT_IP_HEADER, clientIp);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: '/api/:path*',
};
