import { Request, Response } from 'express';
import { testDatabaseConnection } from '@asthiwar/database';

/**
 * The public health check borrowed a pool connection on every request, with no
 * limit, from a pool of ten. One probe result is shared for a few seconds: the
 * platform's health checker still sees an outage within that window, and a
 * flood of requests costs one query instead of one each.
 */
const DATABASE_PROBE_TTL_MS = 5000;
let lastProbe: { at: number; result: ReturnType<typeof testDatabaseConnection> } | null = null;

function probeDatabase(): ReturnType<typeof testDatabaseConnection> {
  const now = Date.now();
  if (!lastProbe || now - lastProbe.at >= DATABASE_PROBE_TTL_MS) {
    lastProbe = { at: now, result: testDatabaseConnection() };
  }
  return lastProbe.result;
}

/**
 * Up or not, and nothing else.
 *
 * This is public and unauthenticated. It used to name the service, its version,
 * the database provider and driver, the query latency and the process uptime —
 * none of which Render's health check reads (it only looks at the status code),
 * and all of which help someone fingerprint the stack or time a restart. The
 * detail of a failed database probe is written to the server log instead.
 */
export async function getHealth(req: Request, res: Response): Promise<void> {
  const { connected } = await probeDatabase();

  res.setHeader('Cache-Control', 'no-store');
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
}
