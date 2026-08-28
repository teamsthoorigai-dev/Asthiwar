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

export const pool = new Pool({
  connectionString,
  ssl: isSslRequired ? { rejectUnauthorized: false } : undefined,
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
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return { connected: false, message };
  }
}
