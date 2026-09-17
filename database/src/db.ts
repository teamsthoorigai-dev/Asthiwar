import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema/index';

const { Pool } = pg;

// Ensure .env is loaded if not already in memory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

const isSslRequired = connectionString?.includes('sslmode=require') || 
                      process.env.NODE_ENV === 'production' ||
                      connectionString?.includes('neon.tech');

/**
 * TLS to the database verifies the server's certificate.
 *
 * `rejectUnauthorized: false` encrypted the connection but accepted any
 * certificate, so anything on the network path could present its own and read
 * every query — customer records and admin password hashes included.
 *
 * - A URL carrying `sslmode=` is configured by node-postgres from the URL itself,
 *   which overrides the object below (require/verify-full both verify).
 * - A single-label host such as Render's internal `dpg-xxxx-a` is only reachable
 *   inside the provider's private network, where the instance may present a
 *   certificate Node cannot verify, so it is not verified by default — turning
 *   verification on there could stop the service connecting at all.
 * - Anything reached by a dotted hostname crosses a network we do not control and
 *   is verified. DATABASE_SSL_CA supplies a private CA (PEM, `\n` escapes allowed);
 *   DATABASE_SSL_REJECT_UNAUTHORIZED=true|false overrides the default outright.
 */
function databaseSslOptions(): pg.PoolConfig['ssl'] {
  if (!isSslRequired) return undefined;

  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim();
  if (ca) return { rejectUnauthorized: true, ca };

  const override = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (override === 'true') return { rejectUnauthorized: true };
  if (override === 'false') return { rejectUnauthorized: false };

  let host = '';
  try {
    host = connectionString ? new URL(connectionString).hostname : '';
  } catch {
    // Unparseable URL: fall through to verifying, the safe default.
  }
  const privateNetworkHost = host !== '' && !host.includes('.');
  return { rejectUnauthorized: !privateNetworkHost };
}

export const pool = new Pool({
  connectionString,
  ssl: databaseSslOptions(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

export async function testDatabaseConnection(): Promise<{ connected: boolean; message: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { connected: true, message: 'Database connection healthy', latencyMs };
    } finally {
      client.release();
    }
  } catch (error) {
    // The driver's message can name the host, database and user. It belongs in
    // the server log, not in the public health response.
    console.error('[db] Health check failed:', error instanceof Error ? error.message : error);
    return { connected: false, message: 'Database unavailable' };
  }
}
