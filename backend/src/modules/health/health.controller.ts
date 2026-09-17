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

export async function getHealth(req: Request, res: Response): Promise<void> {
  const dbStatus = await probeDatabase();

  const isHealthy = dbStatus.connected;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'asthiwar-backend',
    version: '1.0.0',
    database: {
      provider: 'Neon PostgreSQL (node-postgres)',
      connected: dbStatus.connected,
      message: dbStatus.message,
      ...(dbStatus.latencyMs !== undefined ? { latencyMs: dbStatus.latencyMs } : {}),
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
