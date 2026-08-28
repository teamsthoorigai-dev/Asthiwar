import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db.js';
import path from 'path';

async function runMigrations() {
  console.log('🚀 Starting Drizzle database migrations...');
  try {
    const migrationsFolder = path.resolve(__dirname, '../drizzle');
    await migrate(db, { migrationsFolder });
    console.log('✅ All migrations executed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
