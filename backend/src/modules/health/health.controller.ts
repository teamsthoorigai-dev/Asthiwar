import { Request, Response } from 'express';
import { testDatabaseConnection } from '@asthiwar/database';

export async function getHealth(req: Request, res: Response): Promise<void> {
  const dbStatus = await testDatabaseConnection();

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
