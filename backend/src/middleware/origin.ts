import { Request, Response, NextFunction } from 'express';

/** Hostnames trusted outside production: local development and the tunnels used to share it. */
const DEV_HOST_SUFFIXES = ['.devtunnels.ms', '.loca.lt', '.ngrok-free.app', '.ngrok.io', '.ngrok.app'];

function originOf(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.origin === 'null' ? null : parsed.origin;
  } catch {
    return null;
  }
}

export interface OriginPolicy {
  /** A site whose browser requests may carry an admin session and change state. */
  isTrusted(origin: string): boolean;
  /** CORS_ORIGIN contains `*`: any site may read public responses, without credentials. */
  wildcard: boolean;
}

/**
 * Which browser origins this API trusts.
 *
 * Built once per app from CORS_ORIGIN and PUBLIC_BASE_URL. `*` is recorded but
 * never makes an origin trusted: it used to be answered by reflecting the caller's
 * Origin with Access-Control-Allow-Credentials, which is the one combination the
 * CORS specification exists to forbid — any site could read authenticated
 * responses. PUBLIC_BASE_URL is the site customers and staff use, so it is always
 * trusted, even when CORS_ORIGIN forgets to list it.
 */
export function createOriginPolicy(options: {
  corsOrigin: string;
  publicBaseUrl: string;
  production: boolean;
}): OriginPolicy {
  const entries = options.corsOrigin
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const trusted = new Set<string>();
  for (const entry of entries) {
    if (entry === '*') continue;
    const origin = originOf(entry);
    if (origin) trusted.add(origin);
  }
  const publicOrigin = originOf(options.publicBaseUrl);
  if (publicOrigin) trusted.add(publicOrigin);

  return {
    wildcard: entries.includes('*'),
    isTrusted(origin: string): boolean {
      const normalized = originOf(origin);
      if (!normalized) return false;
      if (trusted.has(normalized)) return true;

      if (!options.production) {
        const host = new URL(normalized).hostname.toLowerCase();
        return (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          DEV_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
        );
      }
      return false;
    },
  };
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Refuse state-changing requests that a browser says came from another site.
 *
 * The CORS middleware already rejects a foreign Origin, but only while CORS_ORIGIN
 * is an explicit list, and it never looked at Referer. This check does not depend
 * on that configuration. Browsers attach Origin to every cross-site POST, PUT,
 * PATCH and DELETE, so a write with neither header is a server-side client (curl,
 * a script holding a bearer token) and is let through; the session cookie is
 * SameSite=Lax, so a browser would not have sent it cross-site in any case.
 */
export function rejectCrossSiteWrites(policy: OriginPolicy) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.header('origin');
    const referer = req.header('referer');
    if (origin === undefined && referer === undefined) {
      next();
      return;
    }

    const claimed = origin ?? referer ?? '';
    if (policy.isTrusted(claimed)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'UNTRUSTED_ORIGIN',
        message: 'This request was not sent from the ASTHIWAR site.',
      },
    });
  };
}
