import { Request } from 'express';
import crypto from 'node:crypto';
import net from 'node:net';
import { env } from '../config/env.js';

/** Set by src/proxy.ts in the Next.js app. Keep the names in step with it. */
export const PROXY_SECRET_HEADER = 'x-asthiwar-proxy-secret';
export const PROXY_CLIENT_IP_HEADER = 'x-asthiwar-client-ip';

function secretMatches(supplied: string, expected: string): boolean {
  // Digests first, so the comparison is constant-time and never throws on a
  // length mismatch.
  const a = crypto.createHash('sha256').update(supplied).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * The address of the person making the request.
 *
 * Browser traffic reaches this API through the Next.js rewrite: visitor → Vercel
 * → Render's load balancer → here. `trust proxy 1` makes `req.ip` the address the
 * load balancer saw, which is Vercel's egress, not the visitor. Every IP-keyed
 * rate limit was therefore one bucket shared by the whole site: ten estimate
 * submissions an hour, total, and anyone could spend them.
 *
 * Vercel overwrites X-Forwarded-For with the real client address before the
 * frontend proxy sees it, and that proxy forwards it here with a shared secret.
 * The forwarded address is used only when the secret matches — a caller going to
 * Render directly cannot choose their own bucket. Without the secret configured,
 * this is exactly `req.ip`.
 */
export function clientIp(req: Request): string {
  const secret = env.API_PROXY_SECRET;
  if (secret) {
    const supplied = req.headers[PROXY_SECRET_HEADER];
    const forwarded = req.headers[PROXY_CLIENT_IP_HEADER];
    if (
      typeof supplied === 'string' &&
      typeof forwarded === 'string' &&
      secretMatches(supplied, secret)
    ) {
      const ip = forwarded.trim();
      if (net.isIP(ip)) return ip;
    }
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
